# PulseOps progress

## Implemented
- Next.js/React/TypeScript dashboard and Node HTTP API.
- Manual HTTPS checks restricted to example.com and example.org.
- Five-second target timeout; redirects disabled.
- Named monitor creation, renaming, deletion and duplicate rejection.
- Persistent local monitor/history JSON storage; latest 20 checks.
- All/Online/Failed history filters and counts.
- Configurable HOST, PORT, DATA_DIR and frontend API_BASE_URL.
- Optional Supabase storage through a backend-only secret key.
- Atomic database history insert/prune function; backend-only table access.
- GitHub Actions backend tests, frontend lint/types and production build.

## Verification
45 backend tests pass, including five mocked Supabase adapter tests.
User verified the frontend production build before this backend-only update.
Live database schema execution, hosting and cross-redeploy persistence remain to verify.
See DEPLOYMENT.md for the acceptance checks.

## Limits
Shared demo, no accounts or per-user isolation. Any visitor can edit the shared list.
Manual checks only; no scheduler or alerts. Two approved origins only.
Local JSON mode remains single-process. Hosted data starts empty; no automatic import.
Free hosting can sleep/pause. No automated browser tests yet.
