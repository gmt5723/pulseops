-- Run once in the Supabase SQL editor. Tables are backend-only.
begin;
create table if not exists public.pulseops_monitors (
  id uuid primary key,
  name text not null check (length(trim(name)) between 1 and 60),
  url text not null unique,
  "createdAt" timestamptz not null default now()
);
create table if not exists public.pulseops_checks (
  id uuid primary key,
  url text not null,
  status text not null check (status in ('ONLINE', 'FAILED')),
  "httpStatus" integer check ("httpStatus" between 100 and 599),
  "responseTimeMs" double precision check ("responseTimeMs" >= 0),
  error text,
  "checkedAt" timestamptz not null default now()
);
alter table public.pulseops_monitors enable row level security;
alter table public.pulseops_checks enable row level security;
revoke all on public.pulseops_monitors, public.pulseops_checks from anon, authenticated;
grant select, insert, update, delete on public.pulseops_monitors, public.pulseops_checks to service_role;

-- Serialize writes so pruning and insertion are one atomic operation.
create or replace function public.pulseops_record_check(item jsonb)
returns setof public.pulseops_checks
language plpgsql
set search_path = public
as $$
declare saved public.pulseops_checks;
begin
  perform pg_advisory_xact_lock(71922020);
  insert into public.pulseops_checks
  select * from jsonb_populate_record(null::public.pulseops_checks, item)
  returning * into saved;
  delete from public.pulseops_checks where id in (
    select id from public.pulseops_checks order by "checkedAt" desc, id desc offset 20
  );
  return next saved;
end;
$$;
revoke all on function public.pulseops_record_check(jsonb) from public, anon, authenticated;
grant execute on function public.pulseops_record_check(jsonb) to service_role;
commit;
