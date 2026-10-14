// Read-only diagnostics. Never print credentials, IDs or signed audio URLs.
const Module = require('node:module');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
require('dotenv').config({ path: '.env.local', quiet: true });
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...args) {
  return originalResolve.call(this, request.startsWith('@/') ? path.resolve(process.cwd(), request.slice(2)) : request, ...args);
};
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true }, fileName: filename,
}).outputText, filename);
let user;
const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  let resolved; try { resolved = Module._resolveFilename(request, parent); } catch {}
  if (String(resolved).replaceAll('\\', '/').endsWith('/app/lib/auth/googleAuth.ts')) return { getCurrentUser: async () => user };
  return originalLoad.call(this, request, parent, isMain);
};
(async () => {
  const sql = require('../app/lib/db/index.ts').getDb();
  if (!sql) throw new Error('DatabaseUnavailable');
  const users = await sql`SELECT id FROM users WHERE email = ${'bilal.azeemlab@gmail.com'} LIMIT 1`;
  if (!users.length) { console.log(JSON.stringify({ matchedAccount: false })); return; }
  user = users[0];
  const history = await sql`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE COALESCE(audio_url, '') NOT IN ('', 'null')) AS completed
    FROM generation_history WHERE user_id = ${user.id}`;
  const { NextRequest } = require('next/server');
  const library = require('../app/api/audio-library/route.ts');
  const response = await library.GET(new NextRequest('http://localhost:3000/api/audio-library'));
  if (!response.ok) throw new Error('LibraryQueryFailed');
  const data = await response.json();
  let singleLookup = null;
  if (data.items.length) {
    const single = await library.GET(new NextRequest('http://localhost:3000/api/audio-library?id=' + encodeURIComponent(data.items[0].id)));
    singleLookup = single.ok && typeof (await single.json()).audio_url === 'string';
  }
  console.log(JSON.stringify({ matchedAccount: true, historyRows: Number(history[0].total), completedStudioRows: Number(history[0].completed),
    libraryTotal: data.total, libraryReturned: data.items.length,
    withDuration: data.items.filter(item => item.duration_sec > 0).length,
    withSize: data.items.filter(item => item.size_bytes > 0).length,
    singleLookup, readOnly: true }));
})().catch(error => { console.log(JSON.stringify({ diagnosticFailed: true, errorType: error.name || 'Error' })); process.exitCode = 1; });
