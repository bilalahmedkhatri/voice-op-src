const { test, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const ts = require('typescript');
const fs = require('node:fs');
const pathUtil = require('node:path');
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...args) {
  return originalResolve.call(this, request.startsWith('@/') ? pathUtil.resolve(__dirname, '..', request.slice(2)) : request, ...args);
};
require.extensions['.ts'] = (module, filename) => {
  const result = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    fileName: filename,
  });
  module._compile(result.outputText, filename);
};

const originalLoad = Module._load;
const originalFetch = global.fetch;
const userA = { id: 'user-a', email: 'a@example.test', available_credits: 50, tier: 'free' };
let user, queries, sqlHandler, calls, cookieStore, emailVerified;
const sql = async (strings, ...values) => {
  const query = strings.join('?').replace(/\s+/g, ' ').trim();
  queries.push({ query, values });
  return sqlHandler(query, values);
};
Module._load = function (request, parent, isMain) {
  // API tests must never enter page localization; its ESM Next middleware is verified in browser tests.
  if (request === 'next-intl/middleware') return () => () => { throw new Error('API request entered locale middleware'); };
  let resolved;
  try { resolved = Module._resolveFilename(request, parent); } catch {}
  const path = String(resolved).replaceAll('\\', '/');
  if (path.endsWith('/app/lib/auth/googleAuth.ts')) return {
    getCurrentUser: async () => user,
    exchangeGoogleCodeForTokens: async () => { calls.push('oauth'); return { access_token: 'test' }; },
    getGoogleUserProfile: async () => ({ sub: '1', email: 'a@example.test', email_verified: emailVerified }),
    createOrUpdateUserAndSession: async () => 'session',
    SESSION_COOKIE_NAME: 'vg_session_token', SESSION_MAX_AGE: 100,
  };
  if (path.endsWith('/app/lib/db/index.ts')) return { getDb: () => sql };
  if (path.endsWith('/app/lib/credits.ts')) return {
    verifyCreditBalance: async () => ({ ok: true }),
    deductCredits: async () => ({ balanceAfter: 48 }),
    checkMetaAccountLimit: async () => ({ allowed: true }),
  };
  if (request === 'next/headers') return { cookies: async () => ({
    get: key => cookieStore[key] ? { value: cookieStore[key] } : undefined,
    set: (key, value) => { cookieStore[key] = value; },
  }) };
  return originalLoad.call(this, request, parent, isMain);
};
const { NextRequest } = require('next/server');
const ownership = require('../app/lib/auth/ownership.ts');
const guest = require('../app/lib/auth/guestOwner.ts');
const status = require('../app/api/templates/audio-job/status/route.ts');
const retry = require('../app/api/templates/audio-job/retry/route.ts');
const stream = require('../app/api/templates/audio-job/stream/route.ts');
const attach = require('../app/api/templates/audio-job/route.ts');
const publish = require('../app/api/facebook/post-pages/route.ts');
const connectPage = require('../app/api/facebook/store-token/route.ts');
const mediaPoll = require('../app/api/media/poll/route.ts');
const mediaDownload = require('../app/api/media/download/route.ts');
const mediaProcess = require('../app/api/media/process/route.ts');
const generate = require('../app/api/voiceover/route.ts');
const library = require('../app/api/audio-library/route.ts');
const webhook = require('../app/api/billing/webhook/route.ts');
const billingStatus = require('../app/api/billing/status/[orderId]/route.ts');
const checkout = require('../app/api/billing/checkout/route.ts');
const oauth = require('../app/api/auth/callback/google/route.ts');
const { isSameOriginMutation } = require('../app/lib/requestSecurity.ts');
const { ownedMediaUrl } = require('../app/lib/ownedMedia.ts');
const { fetchPrivateFile } = require('../app/lib/privateDownload.ts');
const local = require('../app/lib/localIndexedDB.ts');
const drafts = require('../app/lib/ownerStorage.ts');
const pending = require('../app/lib/pendingAudioJobs.ts');
const { proxy } = require('../proxy.ts');
const { createHash } = require('node:crypto');
const { audioMetadata, inlineAudioMetadata } = require('../app/lib/audioMetadata.ts');
function metadataWav() {
  const wav = Buffer.alloc(96044);
  wav.write('RIFF'); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8); wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22); wav.writeUInt32LE(24000, 24); wav.writeUInt32LE(48000, 28);
  wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36); wav.writeUInt32LE(96000, 40);
  return wav;
}
const request = (path, body, method = 'POST') => new NextRequest('http://localhost:3000' + path, {
  method, ...(body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}),
});
beforeEach(() => {
  process.env.GATEWAY_API_KEY = 'isolated-test-app-key';
  process.env.GATEWAY_APP_ORIGIN = 'https://frontend.example.test';
  user = userA; queries = []; calls = []; cookieStore = {}; emailVerified = true;
  sqlHandler = async () => [];
  process.env.NEXT_PUBLIC_ENABLE_DATABASE = 'true';
  process.env.OWNERSHIP_TOKEN_SECRET = 'test-only-ownership-secret';
  global.fetch = async (...args) => { calls.push(args); throw new Error('Unexpected outbound request'); };
});
after(() => { Module._load = originalLoad; Module._resolveFilename = originalResolve; global.fetch = originalFetch; });

test('anonymous private audio status is denied before outbound access', async () => {
  user = null;
  const response = await status.GET(request('/api/templates/audio-job/status?jobId=other', null, 'GET'));
  assert.equal(response.status, 401); assert.equal(calls.length, 0);
});
test('foreign audio job is denied with an owner-filtered lookup', async () => {
  const response = await status.GET(request('/api/templates/audio-job/status?jobId=other', null, 'GET'));
  assert.equal(response.status, 404); assert.equal(calls.length, 0);
  assert.deepEqual(queries[0].values, ['other', 'user-a']);
});

test('owned gateway 404 marks only its history row missing to stop pending re-import', async () => {
  sqlHandler = async query => query.startsWith('SELECT') ? [{ id: 'missing', voice_name: 'Kore' }] : [];
  global.fetch = async () => new Response('{}', { status: 404 });
  const response = await status.GET(request('/api/templates/audio-job/status?jobId=missing', null, 'GET'));
  assert.equal(response.status, 404);
  assert.match(queries[1].query, /gateway_job_missing/);
  assert.deepEqual(queries[1].values, ['missing', 'user-a']);
});

test('temporary gateway failure does not mark an owned job permanently missing', async () => {
  sqlHandler = async () => [{ id: 'running' }];
  global.fetch = async () => new Response('{}', { status: 503 });
  assert.equal((await status.GET(request('/api/templates/audio-job/status?jobId=running', null, 'GET'))).status, 502);
  assert.equal(queries.length, 1);
});

test('later successful owned status check clears the missing-job marker', async () => {
  sqlHandler = async query => query.startsWith('SELECT') ? [{ id: 'restored', parameters: { gateway_job_missing: true } }] : [];
  global.fetch = async () => Response.json({ job_id: 'restored', status: 'processing' });
  assert.equal((await status.GET(request('/api/templates/audio-job/status?jobId=restored', null, 'GET'))).status, 200);
  assert.match(queries[1].query, /parameters - 'gateway_job_missing'/);
  assert.deepEqual(queries[1].values, ['restored', 'user-a']);
});
test('foreign template cannot receive an audio attachment', async () => {
  const response = await attach.POST(request('/api/templates/audio-job', { templateId: 'foreign', itemId: 'item', jobId: 'job' }));
  assert.equal(response.status, 404); assert.equal(calls.length, 0);
});
test('owned template cannot claim a foreign job', async () => {
  sqlHandler = async query => query.includes('FROM json_templates') ? [{ id: 't', json_data: { items: [{ id: 'i' }] } }] : [];
  const response = await attach.POST(request('/api/templates/audio-job', { templateId: 't', itemId: 'i', jobId: 'foreign' }));
  assert.equal(response.status, 404);
  assert.equal(queries.some(q => q.query.startsWith('UPDATE')), false);
});
test('attachment ignores caller audio URL, model, timestamp and voice', async () => {
  sqlHandler = async query => query.includes('FROM json_templates') ? [{ id: 't', json_data: { items: [{ id: 'i' }] } }] :
    query.includes('FROM generation_history') ? [{ id: 'job', model_id: 'trusted-model', voice_id: 'trusted-voice', audio_url: 'trusted-url', created_at: '2026-10-10' }] : [];
  const response = await attach.POST(request('/api/templates/audio-job', { templateId: 't', itemId: 'i', jobId: 'job', audioUrl: 'attacker-url', modelId: 'attacker' }));
  assert.equal(response.status, 200);
  const body = await response.json(); assert.equal(body.audioRecord.audio_url, 'trusted-url');
  assert.equal(body.audioRecord.model_id, 'trusted-model');
  assert.ok(queries.at(-1).query.includes('user_id = ?'));
});
test('unknown item inside an owned template is denied', async () => {
  assert.throws(() => ownership.requireTemplateItem({ items: [{ id: 'real' }] }, 'foreign'), { status: 404 });
});
test('Facebook publishing rejects foreign page before provider or credits', async () => {
  const form = new FormData(); form.set('page_id', 'foreign-page'); form.set('message', 'hello');
  const response = await publish.POST(new NextRequest('http://localhost:3000/api/facebook/post-pages', { method: 'POST', body: form }));
  assert.equal(response.status, 404); assert.equal(calls.length, 0);
  assert.deepEqual(queries[0].values, ['user-a', 'foreign-page']);
});
test('foreign template cannot start media extraction', async () => {
  const response = await mediaProcess.POST(request('/api/media/process', { template_id: 'foreign', item_id: 'item', keywords: ['test'] }));
  assert.equal(response.status, 404); assert.equal(calls.length, 0);
});
test('media polling requires template ownership', async () => {
  const response = await mediaPoll.GET(request('/api/media/poll?templateId=foreign&itemId=item', null, 'GET'));
  assert.equal(response.status, 404); assert.equal(calls.length, 0);
});
test('anonymous arbitrary URL download is denied', async () => {
  user = null;
  const response = await mediaDownload.GET(request('/api/media/download?url=http://127.0.0.1/secret', null, 'GET'));
  assert.equal(response.status, 401); assert.equal(calls.length, 0);
});
test('media deletion rejects URLs absent from owned item', async () => {
  sqlHandler = async () => [{ id: 't', json_data: { items: [{ id: 'i' }] } }];
  global.fetch = async (...args) => { calls.push(args); return Response.json({ data: ['https://s3.example.test/owned.mp4?signed=1'] }); };
  const response = await mediaProcess.DELETE(request('/api/media/process', { template_id: 't', item_id: 'i', urls: ['https://s3.example.test/foreign.mp4'] }, 'DELETE'));
  assert.equal(response.status, 404); assert.equal(calls.length, 1);
});
test('media downloader uses trusted fresh signature', () => {
  assert.equal(ownedMediaUrl(['https://store.test/a.mp4?signature=fresh'], 'https://store.test/a.mp4?attacker=query'),
    'https://store.test/a.mp4?signature=fresh');
  assert.throws(() => ownedMediaUrl(['https://store.test/a.mp4'], 'https://other.test/a.mp4'), { status: 404 });
});
test('private downloads reject local HTTP targets and redirect following', async () => {
  await assert.rejects(fetchPrivateFile('http://127.0.0.1/private'), { status: 403 });
  assert.equal(calls.length, 0);
  global.fetch = async (_, options) => { assert.equal(options.redirect, 'error'); return new Response('audio'); };
  await fetchPrivateFile('https://s3.us-west-004.backblazeb2.com/bucket/file');
});
test('async generation registers server-created job for session owner', async () => {
  sqlHandler = async (query, values) => query.startsWith('INSERT INTO generation_history') ?
    [{ id: values[0], user_id: values[1] }] : [];
  global.fetch = async (...args) => { calls.push(args); return Response.json({ job_id: 'server-job', status: 'processing' }); };
  const response = await generate.POST(request('/api/voiceover', { text: 'hello', model_id: 'gemini', voice_id: 'v', user_id: 'attacker' }));
  assert.equal(response.status, 200);
  const inserted = queries.find(q => q.query.startsWith('INSERT'));
  assert.deepEqual(inserted.values.slice(0, 2), ['server-job', 'user-a']);
});
test('generation refuses foreign template before creating provider job', async () => {
  const response = await generate.POST(request('/api/voiceover', { text: 'hello', model_id: 'gemini', voice_id: 'v', templateId: 'foreign', itemId: 'i' }));
  assert.equal(response.status, 404); assert.equal(calls.length, 0);
});
test('job status cannot accept a mismatched upstream job response', async () => {
  sqlHandler = async () => [{ id: 'mine', voice_name: 'v' }];
  global.fetch = async () => Response.json({ job_id: 'other', status: 'completed', audio_url: 'leaked' });
  const response = await status.GET(request('/api/templates/audio-job/status?jobId=mine', null, 'GET'));
  assert.equal(response.status, 502); assert.equal(queries.some(q => q.query.startsWith('UPDATE')), false);
});
test('guest proof is bound to cookie owner, job, integrity and expiration', () => {
  const token = guest.issueGuestJobToken('owner-a', 'job-a');
  guest.verifyGuestJobToken(token, 'owner-a', 'job-a');
  for (const args of [[token, 'owner-b', 'job-a'], [token, 'owner-a', 'job-b'], [token + 'tampered', 'owner-a', 'job-a'], [null, 'owner-a', 'job-a']]) {
    assert.throws(() => guest.verifyGuestJobToken(...args), { status: 404 });
  }
  const now = Date.now; Date.now = () => now() + 8 * 86400000;
  try { assert.throws(() => guest.verifyGuestJobToken(token, 'owner-a', 'job-a'), { status: 404 }); } finally { Date.now = now; }
});
test('offline polling without guest cookie/proof is denied', async () => {
  process.env.NEXT_PUBLIC_ENABLE_DATABASE = 'false';
  const response = await status.GET(request('/api/templates/audio-job/status?jobId=job', null, 'GET'));
  assert.equal(response.status, 404); assert.equal(calls.length, 0);
});
test('library removal unlinks only session-owned templates and history', async () => {
  sqlHandler = async () => [{ id: 'removed' }];
  const response = await library.DELETE(request('/api/audio-library?id=mine', null, 'DELETE'));
  assert.equal(response.status, 200);
  assert.ok(queries.every(q => q.query.includes('user_id = ?') && q.values.includes('user-a')));
  assert.ok(queries.some(q => q.query.startsWith('UPDATE json_templates')));
});

test('library can delete standalone Studio history without a template association', async () => {
  sqlHandler = async query => query.startsWith('DELETE FROM generation_history') ? [{ id: 'studio-only' }] : [];
  const response = await library.DELETE(request('/api/audio-library?id=studio-only', null, 'DELETE'));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).deletedId, 'studio-only');
  assert.ok(queries.every(q => q.values.includes('user-a') && q.query.includes('user_id = ?')));
  assert.equal(calls.length, 0);
});

test('anonymous Library deletion cannot mutate history or template audio', async () => {
  user = null;
  const response = await library.DELETE(request('/api/audio-library?id=other', null, 'DELETE'));
  assert.equal(response.status, 401);
  assert.equal(queries.length, 0); assert.equal(calls.length, 0);
});

test('checkbox batch removal scopes every requested ID to the current owner', async () => {
  sqlHandler = async query => query.startsWith('DELETE') ? [{ id: 'one' }, { id: 'two' }] : [];
  const response = await library.DELETE(request('/api/audio-library?ids=one,two', null, 'DELETE'));
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).deletedIds, ['one', 'two']);
  assert.ok(queries.every(q => q.query.includes('user_id = ?') && q.values.includes('user-a')));
  assert.deepEqual(queries.at(-1).values, ['user-a', false, ['one', 'two']]);
});

test('offline checkbox batch deletion uses one owner-scoped commit', async () => {
  const original = local.getLocalDB;
  const storage = require('../app/lib/localHistoryStorage.ts');
  const deleted = [];
  let transactions = 0;
  const tx = { objectStore: () => ({ delete: id => { deleted.push(id); } }) };
  local.getLocalDB = async scope => { assert.equal(scope, 'account-a'); return { transaction: () => { transactions++; return tx; } }; };
  try {
    const promise = storage.deleteLocalHistoryItem(['one', 'two'], 'account-a');
    await Promise.resolve();
    assert.deepEqual(deleted, ['one', 'two']); assert.equal(transactions, 1);
    tx.oncomplete(); await promise;
  } finally { local.getLocalDB = original; }
});

test('offline audio deletion resolves only after its account-scoped transaction commits', async () => {
  const original = local.getLocalDB;
  const storage = require('../app/lib/localHistoryStorage.ts');
  const req = {};
  const tx = { objectStore: () => ({ delete: id => { assert.equal(id, 'mine'); return req; } }) };
  local.getLocalDB = async scope => { assert.equal(scope, 'account-a'); return { transaction: () => tx }; };
  try {
    let completed = false;
    const promise = storage.deleteLocalHistoryItem('mine', 'account-a').then(() => { completed = true; });
    await Promise.resolve(); req.onsuccess?.(); await Promise.resolve();
    assert.equal(completed, false);
    tx.oncomplete(); await promise;
    assert.equal(completed, true);
  } finally { local.getLocalDB = original; }
});

test('offline deletion reports transaction abort instead of claiming success', async () => {
  const original = local.getLocalDB;
  const storage = require('../app/lib/localHistoryStorage.ts');
  const tx = { error: new Error('Commit failed'), objectStore: () => ({ delete: () => ({}) }) };
  local.getLocalDB = async () => ({ transaction: () => tx });
  try {
    const promise = storage.deleteLocalHistoryItem('mine', 'account-a');
    const rejected = assert.rejects(promise, /Commit failed/);
    await Promise.resolve(); tx.onabort(); await rejected;
  } finally { local.getLocalDB = original; }
});

test('library lists Studio and template audio with owner filters, deduplication and pagination', async () => {
  sqlHandler = async () => [{ id: 'studio-job', voice_name: 'Kore', full_count: '1' }];
  const response = await library.GET(request('/api/audio-library?search=kore&model=gemini&page=2', null, 'GET'));
  assert.equal(response.status, 200);
  assert.match(response.headers.get('cache-control'), /private, no-store/);
  assert.deepEqual((await response.json()).items, [{ id: 'studio-job', voice_name: 'Kore', duration_sec: null, size_bytes: null }]);
  const query = queries[0];
  assert.match(query.query, /FROM generation_history.*UNION ALL.*FROM json_templates/);
  assert.match(query.query, /DISTINCT ON \(id\)/);
  assert.equal(query.values.filter(value => value === 'user-a').length, 2);
  assert.deepEqual(query.values.slice(-2), [10, 10]);
  assert.equal(calls.length, 0);
});

test('historical inline audio returns duration/size without transferring audio headers or URLs', async () => {
  const uri = 'data:audio/wav;base64,' + metadataWav().toString('base64');
  sqlHandler = async () => [{ id: 'old', duration_sec: null, size_bytes: null, inline_audio: uri.slice(0, 8192),
    inline_length: uri.length, inline_tail: uri.slice(-2), full_count: '1' }];
  const data = await (await library.GET(request('/api/audio-library', null, 'GET'))).json();
  assert.deepEqual(data.items, [{ id: 'old', duration_sec: 2, size_bytes: 96044 }]);
});

test('numeric-string stored metadata is normalized for Library formatting', async () => {
  sqlHandler = async () => [{ id: 'stored', duration_sec: '123.45', size_bytes: '48044', full_count: '1' }];
  const data = await (await library.GET(request('/api/audio-library', null, 'GET'))).json();
  assert.deepEqual(data.items, [{ id: 'stored', duration_sec: 123.45, size_bytes: 48044 }]);
});

test('WAV metadata uses audio data length and refuses truncated/unsupported headers', () => {
  const wav = metadataWav();
  assert.deepEqual(audioMetadata(wav), { duration_sec: 2, size_bytes: 96044 });
  assert.equal(audioMetadata(wav.subarray(0, 60)).duration_sec, null);
  const uri = 'data:audio/wav;base64,' + wav.toString('base64');
  assert.deepEqual(inlineAudioMetadata(uri.slice(0, 8192), uri.length, uri.slice(-2)), { duration_sec: 2, size_bytes: 96044 });
  assert.equal(audioMetadata(new Uint8Array([1, 2, 3])).duration_sec, null);
  assert.equal(inlineAudioMetadata('https://storage.invalid/file.wav'), null);
});

test('synchronous WAV generation saves server-measured duration and size', async () => {
  const wav = metadataWav();
  global.fetch = async () => new Response(wav, { headers: { 'Content-Type': 'audio/wav' } });
  const response = await generate.POST(request('/api/voiceover', { text: 'hello', voice_id: 'Kore', model_id: 'gemini' }));
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.duration_seconds, 2); assert.equal(data.size_bytes, 96044);
  const saved = queries.find(query => query.query.startsWith('INSERT INTO generation_history'));
  assert.equal(saved.values[8], 2); assert.equal(JSON.parse(saved.values.at(-1)).size_bytes, 96044);
});

test('asynchronous completion persists gateway metadata in history and linked templates', async () => {
  sqlHandler = async query => query.startsWith('SELECT') ? [{ id: 'job', voice_name: 'Kore', parameters: {} }] : [];
  global.fetch = async () => Response.json({ job_id: 'job', status: 'completed', audio_url: 'https://fixture.invalid/final.wav',
    duration_seconds: 2, size_bytes: 96044 });
  assert.equal((await status.GET(request('/api/templates/audio-job/status?jobId=job', null, 'GET'))).status, 200);
  assert.ok(queries[1].query.includes('size_bytes') && queries[1].values.includes(96044));
  assert.ok(queries[2].query.includes('duration_sec') && queries[2].query.includes('size_bytes'));
});

test('library play/download finds standalone Studio jobs and refuses foreign IDs', async () => {
  sqlHandler = async () => [{ audio_url: 'https://storage.example.test/mine.wav' }];
  const response = await library.GET(request('/api/audio-library?id=mine', null, 'GET'));
  assert.equal((await response.json()).audio_url, 'https://storage.example.test/mine.wav');
  assert.deepEqual(queries[0].values, ['user-a', 'mine', 'user-a', 'mine']);
  assert.match(queries[0].query, /FROM generation_history.*UNION ALL.*FROM json_templates/);
  sqlHandler = async () => [];
  assert.equal((await library.GET(request('/api/audio-library?id=foreign', null, 'GET'))).status, 404);
  user = null;
  queries = [];
  assert.deepEqual((await (await library.GET(request('/api/audio-library', null, 'GET'))).json()).items, []);
  assert.equal(queries.length, 0);
});
test('unverified webhook cannot allocate credits to any account', async () => {
  const response = await webhook.POST(request('/api/billing/webhook', { user_id: 'user-b', status: 'success' }));
  assert.equal(response.status, 503); assert.equal(queries.length, 0);
});
test('OAuth missing cookie/state, mismatch and legacy state all fail closed', async () => {
  for (const url of ['?code=x', '?code=x&state=/admin', '?code=x&state=' + Buffer.from(JSON.stringify({ nonce: 'wrong' })).toString('base64url')]) {
    const req = request('/api/auth/callback/google' + url, null, 'GET');
    const response = await oauth.GET(req);
    assert.ok(response.headers.get('location').includes('csrf_state_mismatch'));
  }
  assert.equal(calls.length, 0);
});
test('same-origin mutations pass; missing or foreign Origin fail closed', () => {
  const make = headers => new Request('https://genzee.video/api/history', { method: 'DELETE', headers });
  assert.equal(isSameOriginMutation(make({ Origin: 'https://genzee.video' })), true);
  assert.equal(isSameOriginMutation(make({ Origin: 'https://evil.test' })), false);
  assert.equal(isSameOriginMutation(make({})), false);
  assert.equal(isSameOriginMutation(make({ 'Sec-Fetch-Site': 'same-origin' })), true);
});
test('draft keys isolate accounts in the same browser tab', () => {
  drafts.setOwnerScope('account-a'); const a = drafts.ownerDraftKey('pending_voice_script');
  drafts.setOwnerScope('account-b'); const b = drafts.ownerDraftKey('pending_voice_script');
  assert.notEqual(a, b);
});
test('local storage rejects late completion from another account before opening DB', async () => {
  global.fetch = async () => Response.json({ owner_scope: 'account-b' });
  await assert.rejects(local.getLocalDB('account-a'), /Account changed/);
});
test('stale account scope is rejected by proxy before route mutation', async () => {
  const req = new NextRequest('http://localhost:3000/api/templates', { method: 'POST',
    headers: { Origin: 'http://localhost:3000', 'X-Owner-Scope': createHash('sha256').update('user-b').digest('hex') } });
  const response = await proxy(req);
  assert.equal(response.status, 409);
  assert.equal(response.headers.get('X-Identity-Changed'), 'true');
  assert.equal(queries.length, 0);
});
test('current account scope passes and private responses cannot be shared-cache stored', async () => {
  const req = new NextRequest('http://localhost:3000/api/templates', { headers: {
    'X-Owner-Scope': createHash('sha256').update('user-a').digest('hex') } });
  const response = await proxy(req);
  assert.equal(response.status, 200); assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
});
test('offline guest proof allows only the matching browser owner', async () => {
  process.env.NEXT_PUBLIC_ENABLE_DATABASE = 'false';
  cookieStore.vg_guest_owner = 'a'.repeat(64);
  const token = guest.issueGuestJobToken(cookieStore.vg_guest_owner, 'job-a');
  global.fetch = async () => Response.json({ job_id: 'job-a', status: 'processing' });
  const req = new NextRequest('http://localhost:3000/api/templates/audio-job/status?jobId=job-a', { headers: { 'X-Voice-Job-Token': token } });
  assert.equal((await status.GET(req)).status, 200);
  cookieStore.vg_guest_owner = 'b'.repeat(64);
  assert.equal((await status.GET(req)).status, 404);
});
test('valid OAuth state accepts internal destinations and rejects external returnTo', async () => {
  for (const returnTo of ['/settings?tab=account', '//evil.test/path', '/\\evil.test/path']) {
    const state = Buffer.from(JSON.stringify({ nonce: 'nonce', returnTo })).toString('base64url');
    const req = new NextRequest('http://localhost:3000/api/auth/callback/google?code=x&state=' + state,
      { headers: { Cookie: 'vg_oauth_nonce=nonce' } });
    const response = await oauth.GET(req);
    assert.ok(response.headers.get('location').startsWith('http://localhost:3000/'));
    assert.equal(response.cookies.get('vg_oauth_nonce').value, '');
  }
});
test('OAuth preserves a validated locale, query and hash on success and failure', async () => {
  const returnTo = '/pt/facebook/integration?tab=pages#connected';
  const state = Buffer.from(JSON.stringify({ nonce: 'nonce', returnTo })).toString('base64url');
  const req = new NextRequest('http://localhost:3000/api/auth/callback/google?code=x&state=' + state,
    { headers: { Cookie: 'vg_oauth_nonce=nonce' } });
  assert.equal((await oauth.GET(req)).headers.get('location'), 'http://localhost:3000' + returnTo);
  emailVerified = false;
  assert.equal((await oauth.GET(req)).headers.get('location'), 'http://localhost:3000/pt/admin?error=profile_failed');
});
test('missing owned audio returns 404 on delete without touching another owner', async () => {
  const response = await library.DELETE(request('/api/audio-library?id=foreign', null, 'DELETE'));
  assert.equal(response.status, 404);
  assert.ok(queries.every(q => q.values.includes('user-a')));
});
test('Facebook connect rejects token for a different page before gateway/storage writes', async () => {
  global.fetch = async (...args) => { calls.push(args); return Response.json({ id: 'different-page', name: 'Other' }); };
  const response = await connectPage.POST(request('/api/facebook/store-token', { page_id: 'requested-page', access_token: 'fixture-token' }));
  assert.equal(response.status, 403); assert.equal(calls.length, 1); assert.equal(queries.length, 0);
  assert.equal(calls[0][1].headers.Authorization, 'Bearer fixture-token');
  assert.equal(calls[0][0].includes('fixture-token'), false);
});
test('synchronous generation returns the server-owned history ID', async () => {
  sqlHandler = async (query, values) => query.startsWith('INSERT INTO generation_history') ? [{ id: values[0], user_id: values[1] }] : [];
  global.fetch = async () => new Response(new Uint8Array([1, 2, 3]), { headers: { 'Content-Type': 'audio/wav' } });
  const response = await generate.POST(request('/api/voiceover', { text: 'hello', model_id: 'gemini', voice_id: 'v' }));
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.id, queries.find(q => q.query.startsWith('INSERT')).values[0]);
});
test('synchronous persistence failure cannot report ownership success', async () => {
  sqlHandler = async query => { if (query.startsWith('INSERT')) throw new Error('fixture DB outage'); return []; };
  global.fetch = async () => new Response(new Uint8Array([1, 2, 3]), { headers: { 'Content-Type': 'audio/wav' } });
  const response = await generate.POST(request('/api/voiceover', { text: 'hello', model_id: 'gemini', voice_id: 'v' }));
  assert.equal(response.status, 500);
});
test('Google profile with an unverified email cannot create a login session', async () => {
  emailVerified = false;
  const state = Buffer.from(JSON.stringify({ nonce: 'nonce', returnTo: '/admin' })).toString('base64url');
  const req = new NextRequest('http://localhost:3000/api/auth/callback/google?code=x&state=' + state,
    { headers: { Cookie: 'vg_oauth_nonce=nonce' } });
  const response = await oauth.GET(req);
  assert.ok(response.headers.get('location').includes('profile_failed'));
});
test('offline anonymous billing status cannot fabricate a successful payment', async () => {
  user = null; process.env.NEXT_PUBLIC_ENABLE_DATABASE = 'false';
  const response = await billingStatus.GET(request('/api/billing/status/arbitrary', null, 'GET'), { params: Promise.resolve({ orderId: 'arbitrary' }) });
  assert.equal(response.status, 401);
});
test('production localhost Host cannot unlock credit simulation', async () => {
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    const response = await checkout.POST(request('/api/billing/checkout', { packageId: 'pro', simulateSuccess: true }));
    assert.equal(response.status, 403);
  } finally {
    if (previous === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previous;
  }
});

test('gateway headers identify the app without frontend user identity', () => {
  const { gatewayHeaders } = require('../app/lib/gatewayHeaders.ts');
  process.env.GATEWAY_APP_ORIGIN = 'https://Frontend.Example.test:443/';
  assert.deepEqual(gatewayHeaders({ 'Content-Type': 'application/json' }), {
    'Content-Type': 'application/json',
    'X-API-Key': 'isolated-test-app-key',
    'X-App-Origin': 'https://frontend.example.test',
  });
});

test('gateway headers reject missing app credentials and invalid origins', () => {
  const { gatewayHeaders } = require('../app/lib/gatewayHeaders.ts');
  delete process.env.GATEWAY_API_KEY;
  assert.throws(() => gatewayHeaders(), /not configured/);
  process.env.GATEWAY_API_KEY = 'isolated-test-app-key';
  for (const origin of ['example.com', 'https://*.example.test', 'https://user:secret@example.test', 'https://example.test/path', 'ftp://example.test']) {
    process.env.GATEWAY_APP_ORIGIN = origin;
    assert.throws(() => gatewayHeaders());
  }
});

test('model catalog proxy sends server app credentials', async () => {
  const models = require('../app/api/voiceover/models/route.ts');
  global.fetch = async (...args) => { calls.push(args); return Response.json({ models: [], count: 0 }); };
  const response = await models.GET();
  assert.equal(response.status, 200);
  assert.equal(calls[0][1].headers['X-API-Key'], 'isolated-test-app-key');
  assert.equal(calls[0][1].headers['X-App-Origin'], 'https://frontend.example.test');
});


test('retry refuses foreign and anonymous jobs before gateway access', async () => {
  assert.equal((await retry.POST(request('/api/templates/audio-job/retry', { jobId: 'foreign' }))).status, 404);
  user = null;
  assert.equal((await retry.POST(request('/api/templates/audio-job/retry', { jobId: 'foreign' }))).status, 401);
  assert.equal(calls.length, 0);
});

test('owned retry forwards only job ID and server app credentials without credit writes', async () => {
  sqlHandler = async () => [{ id: 'mine' }];
  global.fetch = async (url, options) => {
    calls.push(url);
    assert.ok(url.endsWith('/api/v1/audio/tts/retry/mine'));
    assert.equal(options.method, 'POST');
    assert.equal(options.headers['X-API-Key'], 'isolated-test-app-key');
    assert.equal(options.body, undefined);
    return Response.json({ job_id: 'mine', status: 'processing' });
  };
  const response = await retry.POST(request('/api/templates/audio-job/retry', { jobId: 'mine', text: 'replacement', user_id: 'other' }));
  assert.equal(response.status, 202);
  assert.equal(calls.length, 1);
  assert.equal(queries.length, 1);
  assert.deepEqual(queries[0].values, ['mine', 'user-a']);
});

test('retry preserves upstream conflict and rejects mismatched job responses', async () => {
  sqlHandler = async () => [{ id: 'mine' }];
  global.fetch = async () => Response.json({}, { status: 409 });
  assert.equal((await retry.POST(request('/api/templates/audio-job/retry', { jobId: 'mine' }))).status, 409);
  global.fetch = async () => Response.json({ job_id: 'foreign', status: 'processing' });
  assert.equal((await retry.POST(request('/api/templates/audio-job/retry', { jobId: 'mine' }))).status, 502);
});

test('guest retry requires the exact signed cookie owner and job proof', async () => {
  process.env.NEXT_PUBLIC_ENABLE_DATABASE = 'false';
  cookieStore.vg_guest_owner = 'a'.repeat(64);
  const token = guest.issueGuestJobToken('a'.repeat(64), 'mine');
  assert.equal((await retry.POST(request('/api/templates/audio-job/retry', { jobId: 'mine' }))).status, 404);
  assert.equal(calls.length, 0);
  global.fetch = async () => { calls.push('retry'); return Response.json({ job_id: 'mine', status: 'processing' }); };
  const req = request('/api/templates/audio-job/retry', { jobId: 'mine' });
  req.headers.set('X-Voice-Job-Token', token);
  assert.equal((await retry.POST(req)).status, 202);
  const foreign = request('/api/templates/audio-job/retry', { jobId: 'other' });
  foreign.headers.set('X-Voice-Job-Token', token);
  assert.equal((await retry.POST(foreign)).status, 404);
  assert.equal(calls.length, 1);
});

test('stream refuses foreign jobs and invalid cursors before upstream access', async () => {
  assert.equal((await stream.GET(request('/api/templates/audio-job/stream?jobId=foreign', null, 'GET'))).status, 404);
  assert.equal((await stream.GET(request('/api/templates/audio-job/stream?jobId=mine&after=-1', null, 'GET'))).status, 400);
  user = null;
  assert.equal((await stream.GET(request('/api/templates/audio-job/stream?jobId=mine', null, 'GET'))).status, 401);
  assert.equal(calls.length, 0);
});

test('owned stream passes through ordered bytes and resume cursor without credit writes', async () => {
  sqlHandler = async () => [{ id: 'mine' }];
  const body = '{"event":"chunk","index":1}\n';
  global.fetch = async (url, options) => {
    calls.push(url);
    assert.ok(url.endsWith('/tts/stream/mine?after=1'));
    assert.equal(options.headers['X-API-Key'], 'isolated-test-app-key');
    return new Response(body);
  };
  const response = await stream.GET(request('/api/templates/audio-job/stream?jobId=mine&after=1', null, 'GET'));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Content-Type'), 'application/x-ndjson');
  assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
  assert.equal(await response.text(), body);
  assert.equal(queries.length, 1);
  assert.deepEqual(queries[0].values, ['mine', 'user-a']);
});

test('guest stream validates cookie-bound job proof', async () => {
  process.env.NEXT_PUBLIC_ENABLE_DATABASE = 'false';
  cookieStore.vg_guest_owner = 'a'.repeat(64);
  const token = guest.issueGuestJobToken('a'.repeat(64), 'mine');
  global.fetch = async () => { calls.push('stream'); return new Response('{"event":"completed"}\n'); };
  const req = request('/api/templates/audio-job/stream?jobId=mine', null, 'GET');
  req.headers.set('X-Voice-Job-Token', token);
  assert.equal((await stream.GET(req)).status, 200);
  const foreign = request('/api/templates/audio-job/stream?jobId=other', null, 'GET');
  foreign.headers.set('X-Voice-Job-Token', token);
  assert.equal((await stream.GET(foreign)).status, 404);
  assert.equal(calls.length, 1);
});

test('pending jobs survive re-read, isolate owners and reject stale account writes', () => {
  const originalStorage = global.localStorage, originalWindow = global.window;
  const records = new Map();
  global.localStorage = { getItem: key => records.get(key) || null, setItem: (key, value) => records.set(key, value) };
  global.window = { dispatchEvent: () => {} };
  try {
    drafts.setOwnerScope('account-a');
    const job = { jobId: 'pending-1', ownerScope: 'account-a', voice: 'Kore', model: 'gemini', format: 'short', params: { text: 'original', rate: 1, pitch: 1, volume: 1 } };
    pending.savePendingAudioJob(job);
    assert.deepEqual(pending.pendingAudioJobs(), [job]);
    pending.savePendingAudioJob(job);
    assert.equal(pending.pendingAudioJobs().length, 1);
    drafts.setOwnerScope('account-b');
    assert.deepEqual(pending.pendingAudioJobs(), []);
    assert.throws(() => pending.savePendingAudioJob(job), /Account changed/);
    pending.removePendingAudioJob('pending-1');
    drafts.setOwnerScope('account-a');
    assert.equal(pending.pendingAudioJobs().length, 1);
    pending.removePendingAudioJob('pending-1');
    assert.deepEqual(pending.pendingAudioJobs(), []);
  } finally { global.localStorage = originalStorage; global.window = originalWindow; }
});

test('unfinished history lookup is limited to the current owner and server-created jobs', async () => {
  const history = require('../app/api/history/route.ts');
  const response = await history.GET(request('/api/history?pending=true', null, 'GET'));
  assert.equal(response.status, 200);
  assert.deepEqual(queries[0].values, ['user-a', true]);
  assert.ok(queries[0].query.includes("parameters->>'server_owned_job' = 'true'"));
  assert.ok(queries[0].query.includes('audio_url IS NULL'));
  assert.equal(calls.length, 0);
});

test('server history recovery ignores completed/untrusted records and uses the current frontend scope', () => {
  const row = { id: 'job-1', prompt_text: 'Original', model_id: 'gemini', voice_id: 'Kore', parameters: { server_owned_job: true, speed: 1.2 } };
  const recovered = pending.pendingJobFromHistory(row, 'frontend-a');
  assert.equal(recovered.ownerScope, 'frontend-a');
  assert.equal(recovered.params.text, 'Original');
  assert.equal(recovered.params.rate, 1.2);
  assert.equal(pending.pendingJobFromHistory({ ...row, audio_url: 'https://fixture.test/final.wav' }, 'frontend-a'), null);
  assert.equal(pending.pendingJobFromHistory({ ...row, parameters: {} }, 'frontend-a'), null);
  assert.equal(pending.pendingJobFromHistory({ ...row, parameters: 'invalid' }, 'frontend-a'), null);
  assert.equal(pending.pendingJobFromHistory({ ...row, parameters: { server_owned_job: true, gateway_job_missing: true } }, 'frontend-a'), null);
});
