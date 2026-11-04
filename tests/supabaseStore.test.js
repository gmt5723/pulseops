const test = require('node:test');
const assert = require('node:assert/strict');
const { createSupabaseStore } = require('../supabaseStore');
function fixture(responses) {
  const calls = [];
  const store = createSupabaseStore({ url: 'https://project.supabase.co', key: 'sb_secret_test', fetchImpl: async (url, options) => {
    calls.push({ url, ...options });
    const next = responses.shift();
    if (next instanceof Error) throw next;
    return new Response(JSON.stringify(next.body), { status: next.status ?? 200 });
  }});
  return { store, calls };
}
test('cloud: validates configuration rather than silently falling back', () => {
  assert.throws(() => createSupabaseStore({url:'https://project.supabase.co'}));
  assert.throws(() => createSupabaseStore({url:'http://project.supabase.co',key:'secret'}));
});
test('cloud: create validates and normalizes fields; secret uses apikey only', async () => {
  const { store, calls } = fixture([{body:[{id:'saved'}]}]);
  await assert.rejects(store.createMonitor({name:' ',url:'https://example.com'}));
  await assert.rejects(store.createMonitor({name:'Test',url:'http://localhost'}));
  assert.equal(calls.length,0);
  assert.deepEqual(await store.createMonitor({name:' Test ',url:'https://example.com#x'}),{id:'saved'});
  const payload=JSON.parse(calls[0].body);
  assert.equal(payload.name,'Test'); assert.equal(payload.url,'https://example.com/');
  assert.equal(calls[0].headers.apikey,'sb_secret_test');
  assert.equal(calls[0].headers.Authorization,undefined);
});
test('cloud: maps duplicates and hides database failure details', async () => {
  const {store}=fixture([{status:409,body:{code:'23505'}},{status:500,body:{message:'sensitive detail'}},new Error('secret')]);
  await assert.rejects(store.createMonitor({name:'x',url:'https://example.com'}),{statusCode:400});
  await assert.rejects(store.listMonitors(),e=>e.statusCode===503&&!e.message.includes('sensitive'));
  await assert.rejects(store.listChecks(),{statusCode:503});
});
test('cloud: rename and delete preserve missing record semantics', async () => {
  const {store,calls}=fixture([{body:[]},{body:[]}]);
  assert.equal(await store.renameMonitor('bad',{name:'x'}),null);
  assert.equal(await store.deleteMonitor('bad'),false);
  assert.equal(calls.length,0);
  const id='12345678-1234-1234-1234-123456789012';
  assert.equal(await store.renameMonitor(id,{name:'x'}),null);
  assert.equal(await store.deleteMonitor(id),false);
});
test('cloud: records history via atomic database RPC and requests newest 20', async () => {
  const {store,calls}=fixture([{body:[{id:'saved'}]},{body:[]}]);
  assert.deepEqual(await store.recordCheck({url:'https://example.org',status:'ONLINE',httpStatus:200,responseTimeMs:12,error:null}),{id:'saved'});
  assert.match(calls[0].url,/rpc\/pulseops_record_check$/);
  assert.equal(JSON.parse(calls[0].body).item.url,'https://example.org/');
  await store.listChecks(); assert.match(calls[1].url,/limit=20/);
});
