const { randomUUID } = require('node:crypto');
const validateUrl = require('./validateUrl');

function createSupabaseStore({ url, key, fetchImpl = globalThis.fetch }) {
  if (!url || !key) throw new Error('Set both SUPABASE_URL and SUPABASE_SECRET_KEY.');
  const base = new URL(url);
  if (base.protocol !== 'https:' || base.username || base.password) {
    throw new Error('SUPABASE_URL must be an HTTPS project URL.');
  }
  async function request(route, method = 'GET', body) {
    let response;
    try {
      response = await fetchImpl(`${base.origin}/rest/v1/${route}`, {
        method,
        headers: { apikey: key, 'Content-Type': 'application/json', Prefer: 'return=representation',
          ...(key.startsWith('eyJ') ? { Authorization: `Bearer ${key}` } : {}) },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        signal: AbortSignal.timeout(8000),
      });
    } catch {
      throw Object.assign(new Error('Database unavailable. Please retry shortly.'), { statusCode: 503 });
    }
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      if (data?.code === '23505') {
        throw Object.assign(new Error('A monitor for this URL already exists.'), { statusCode: 400 });
      }
      throw Object.assign(new Error('Database request failed. Check the backend configuration.'), { statusCode: 503 });
    }
    if (!Array.isArray(data)) throw Object.assign(new Error('Invalid database response.'), { statusCode: 503 });
    return data;
  }
  function name(value) {
    if (typeof value !== 'string' || !value.trim() || value.trim().length > 60) {
      throw Object.assign(new Error('Enter a monitor name of 1–60 characters.'), { statusCode: 400 });
    }
    return value.trim();
  }
  function target(value) {
    try { return validateUrl(value); } catch (error) { error.statusCode = 400; throw error; }
  }
  const validId = (id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  return {
    listMonitors: () => request('pulseops_monitors?select=*&order=createdAt.desc,id.desc'),
    async createMonitor(input) {
      const record = { id: randomUUID(), name: name(input?.name), url: target(input?.url), createdAt: new Date().toISOString() };
      return (await request('pulseops_monitors', 'POST', record))[0];
    },
    async renameMonitor(id, input) {
      if (!validId(id)) return null;
      return (await request(`pulseops_monitors?id=eq.${id}`, 'PATCH', { name: name(input?.name) }))[0] ?? null;
    },
    async deleteMonitor(id) {
      if (!validId(id)) return false;
      return (await request(`pulseops_monitors?id=eq.${id}`, 'DELETE')).length > 0;
    },
    listChecks: () => request('pulseops_checks?select=*&order=checkedAt.desc,id.desc&limit=20'),
    async recordCheck(result) {
      const record = { ...result, url: target(result.url), id: randomUUID(), checkedAt: new Date().toISOString() };
      return (await request('rpc/pulseops_record_check', 'POST', { item: record }))[0];
    },
  };
}
module.exports = { createSupabaseStore };
