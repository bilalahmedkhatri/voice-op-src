// Actual SQL regression in connection-local temporary tables, never user tables.
const assert = require('node:assert/strict');
const Module = require('node:module');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
require('dotenv').config({ path: '.env.local', quiet: true });
const { neon } = require('@neondatabase/serverless');
const databaseFetch = global.fetch;
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...args) {
  return originalResolve.call(this, request.startsWith('@/') ? path.resolve(__dirname, '..', request.slice(2)) : request, ...args);
};
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true }, fileName: filename,
}).outputText, filename);
const captured = [];
const user = { id: 'fixture-owner' };
const sql = async (strings, ...values) => {
  captured.push({ text: strings.reduce((text, part, index) => text + (index ? '$' + index : '') + part, ''), values });
  return [{ id: 'new', voice_name: 'Kore', model_id: 'gemini', parameters: {} }];
};
const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  let resolved; try { resolved = Module._resolveFilename(request, parent); } catch {}
  const name = String(resolved).replaceAll('\\', '/');
  if (name.endsWith('/app/lib/auth/googleAuth.ts')) return { getCurrentUser: async () => user };
  if (name.endsWith('/app/lib/db/index.ts')) return { getDb: () => sql };
  return originalLoad.call(this, request, parent, isMain);
};
(async () => {
  const connection = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connection) throw new Error('DatabaseUnavailable');
  const db = neon(connection);
  const { deleteOwnedAudio } = require('../app/lib/deleteOwnedAudio.ts');
  const { linkOwnedAudioJob } = require('../app/lib/audioJobLinks.ts');
  const { syncOwnedAudioJob } = require('../app/lib/audioJobs.ts');
  const { GET: history } = require('../app/api/history/route.ts');
  const { GET: library } = require('../app/api/audio-library/route.ts');
  const { NextRequest } = require('next/server');
  const context = { user, sql };
  const queries = [
    // Explicit pg_temp search_path ensures even unexpected fixture failure cannot
    // fall through to unqualified permanent tables in public.
    db.query('SET LOCAL search_path = pg_temp'),
    db.query("CREATE TEMP TABLE json_templates (id text PRIMARY KEY, user_id text, audio_urls jsonb, json_data jsonb DEFAULT '{}', updated_at timestamptz, updated_by text) ON COMMIT DROP"),
    db.query(`CREATE TEMP TABLE generation_history (id text PRIMARY KEY, user_id text, prompt_text text DEFAULT 'fixture', model_id text, model_name text,
      voice_id text, voice_name text, audio_url text, duration_sec numeric, generation_time_sec numeric, parameters jsonb DEFAULT '{}', created_at timestamptz DEFAULT NOW()) ON COMMIT DROP`),
    db.query(`INSERT INTO json_templates (id,user_id,audio_urls) VALUES
      ('empty','fixture-owner','{}'),('object','fixture-owner','{"legacy":"preserve"}'),('scalar','fixture-owner','7'),
      ('json-null','fixture-owner','null'),('sql-null','fixture-owner',NULL),
      ('array','fixture-owner','[{"job_id":"linked"},{"job_id":"keep"}]'),
      ('foreign','other-owner','[{"job_id":"linked"}]')`),
    db.query(`INSERT INTO generation_history (id,user_id,parameters) VALUES
      ('standalone','fixture-owner','{}'),('linked','fixture-owner','{}'),('foreign-history','other-owner','{}'),
      ('missing','fixture-owner','{"server_owned_job":true}'), ('bulk-one','fixture-owner','{}'), ('bulk-two','fixture-owner','{}')`),
  ];
  const appendCaptured = () => { for (const query of captured.splice(0)) queries.push(db.query(query.text, query.values)); };
  const checks = [];
  const check = (query, verify) => { checks.push({ index: queries.length, verify }); queries.push(db.query(query)); };
  await deleteOwnedAudio(context, ['bulk-one', 'bulk-two', 'foreign-history']); appendCaptured();
  check(`SELECT id FROM generation_history WHERE id IN ('bulk-one','bulk-two','foreign-history')`,
    rows => assert.deepEqual(rows.map(row => row.id), ['foreign-history']));
  await deleteOwnedAudio(context, ['standalone']); appendCaptured();
  check(`SELECT COUNT(*) AS remaining FROM generation_history WHERE id='standalone'`, rows => assert.equal(Number(rows[0].remaining), 0));
  await deleteOwnedAudio(context, ['linked']); appendCaptured();
  check(`SELECT id,audio_urls FROM json_templates ORDER BY id`, rows => {
    const byId = Object.fromEntries(rows.map(row => [row.id, row.audio_urls]));
    assert.deepEqual(byId.array, [{ job_id: 'keep' }]); assert.deepEqual(byId.foreign, [{ job_id: 'linked' }]);
    assert.deepEqual(byId.object, { legacy: 'preserve' }); assert.deepEqual(byId.empty, {}); assert.equal(byId.scalar, 7);
  });
  await deleteOwnedAudio(context, [], true); appendCaptured();
  check(`SELECT id,audio_urls FROM json_templates WHERE id IN ('object','array','foreign') ORDER BY id`, rows => {
    assert.deepEqual(rows.map(row => row.audio_urls), [[], [{ job_id: 'linked' }], { legacy: 'preserve' }]);
  });
  check(`SELECT id FROM generation_history`, rows => assert.deepEqual(rows.map(row => row.id), ['foreign-history']));
  queries.push(db.query(`INSERT INTO generation_history(id,user_id,voice_name,model_id,parameters) VALUES
    ('new','fixture-owner','Kore','gemini','{"server_owned_job":true}'),('missing','fixture-owner','Kore','gemini','{"server_owned_job":true}')`));
  await linkOwnedAudioJob(context, 'empty', 'item', { id: 'new', model_id: 'gemini', voice_id: 'Kore' }); appendCaptured();
  global.fetch = async () => Response.json({ job_id: 'new', status: 'completed', audio_url: 'https://fixture.invalid/audio.wav', duration_seconds: 1, size_bytes: 48044 });
  await syncOwnedAudioJob(context, 'new'); appendCaptured();
  check(`SELECT audio_urls FROM json_templates WHERE id='empty'`, rows => assert.equal(rows[0].audio_urls[0].audio_url, 'https://fixture.invalid/audio.wav'));
  check(`SELECT duration_sec,parameters FROM generation_history WHERE id='new'`, rows => {
    assert.equal(Number(rows[0].duration_sec), 1); assert.equal(rows[0].parameters.size_bytes, 48044);
  });
  await library(new NextRequest('http://localhost:3000/api/audio-library')); appendCaptured();
  checks.push({ index: queries.length - 1, verify: rows => {
    assert.equal(rows.length, 1); assert.equal(Number(rows[0].duration_sec), 1); assert.equal(Number(rows[0].size_bytes), 48044);
  } });
  global.fetch = async () => new Response('{}', { status: 404 });
  await assert.rejects(syncOwnedAudioJob(context, 'missing'), { status: 404 }); appendCaptured();
  await history(new NextRequest('http://localhost:3000/api/history?pending=true')); appendCaptured();
  checks.push({ index: queries.length - 1, verify: rows => assert.equal(rows.some(row => row.id === 'missing'), false) });
  global.fetch = databaseFetch;
  const results = await db.transaction(queries);
  for (const { index, verify } of checks) verify(results[index]);
  console.log(JSON.stringify({ postgresTemporaryTables: true, standaloneDelete: true, mixedJsonTypes: true,
    clearAll: true, foreignDataPreserved: true, linkingAndCompletion: true, missingPendingExcluded: true, userDataChanged: false }));
})().catch(error => {
  console.error(JSON.stringify({ regressionFailed: true, errorType: error.name || 'Error', code: error.code || null }));
  process.exitCode = 1;
});
