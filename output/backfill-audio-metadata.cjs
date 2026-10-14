// Scoped metadata repair: read WAV headers; update only this owner's statistics.
const Module = require('node:module'), fs = require('node:fs'), path = require('node:path'), ts = require('typescript');
require('dotenv').config({ path: '.env.local', quiet: true });
const resolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...args) { return resolve.call(this, request.startsWith('@/') ? path.resolve(process.cwd(), request.slice(2)) : request, ...args); };
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true }, fileName: filename,
}).outputText, filename);
(async () => {
  const sql = require('../app/lib/db/index.ts').getDb();
  const { audioMetadata, inlineAudioMetadata } = require('../app/lib/audioMetadata.ts');
  const { fetchPrivateFile } = require('../app/lib/privateDownload.ts');
  const owners = await sql`SELECT id FROM users WHERE email=${'bilal.azeemlab@gmail.com'} LIMIT 1`;
  if (!owners.length) throw new Error('OwnerNotFound');
  const owner = owners[0].id;
  const rows = await sql`SELECT id,audio_url,duration_sec,parameters FROM generation_history WHERE user_id=${owner}
    AND COALESCE(audio_url,'') NOT IN ('','null') AND (duration_sec IS NULL OR parameters->>'size_bytes' IS NULL) LIMIT 50`;
  let repaired = 0, unavailable = 0;
  for (const row of rows) {
    try {
      let metadata = inlineAudioMetadata(row.audio_url.slice(0, 8192), row.audio_url.length, row.audio_url.slice(-2));
      if (!metadata) {
        const response = await fetchPrivateFile(row.audio_url, { Range: 'bytes=0-8191' });
        const total = Number(response.headers.get('content-range')?.split('/').at(-1) || response.headers.get('content-length'));
        const reader = response.body.getReader(), chunks = [];
        let length = 0;
        try {
          while (length < 8192) {
            const { done, value } = await reader.read(); if (done) break;
            const chunk = value.subarray(0, 8192 - length); chunks.push(Buffer.from(chunk)); length += chunk.length;
          }
        } finally { await reader.cancel(); }
        if (!Number.isFinite(total) || total < length) throw new Error('UnknownFileSize');
        metadata = audioMetadata(Buffer.concat(chunks), total);
      }
      if (!metadata.duration_sec || !metadata.size_bytes) throw new Error('UnsupportedAudioHeader');
      const changed = await sql`UPDATE generation_history SET duration_sec=${metadata.duration_sec},
        parameters=COALESCE(parameters,'{}'::jsonb)||${JSON.stringify({ size_bytes: metadata.size_bytes })}::jsonb
        WHERE user_id=${owner} AND id=${row.id} RETURNING id`;
      if (changed.length) repaired++;
    } catch { unavailable++; }
  }
  console.log(JSON.stringify({ candidates: rows.length, repaired, unavailable, scopedMetadataOnly: true, audioRegenerated: false }));
})().catch(error => { console.error(JSON.stringify({ failed: true, errorType: error.name || 'Error' })); process.exitCode = 1; });
