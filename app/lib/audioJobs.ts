import { OwnershipError, requireId, type OwnerContext } from './auth/ownership';
import { gatewayHeaders } from './gatewayHeaders';

export async function requireOwnedAudioJob(context: OwnerContext, jobId: unknown) {
  const id = requireId(jobId, 'Audio job ID');
  const { user, sql } = context;
  // Only /api/voiceover may create these IDs; client history uploads cannot claim jobs.
  const rows = await sql`SELECT * FROM generation_history WHERE id = ${id} AND user_id = ${user.id} LIMIT 1`;
  if (!rows.length) throw new OwnershipError('Audio job not found.', 404);
  return rows[0];
}

async function requestAudioJob(jobId: string, retry = false) {
  const base = process.env.VOICEOVER_API_URL || 'http://localhost:8000';
  const headers = gatewayHeaders();
  const response = await fetch(`${base}/api/v1/audio/tts/${retry ? 'retry' : 'status'}/${encodeURIComponent(jobId)}`, {
    method: retry ? 'POST' : 'GET', headers, cache: 'no-store', signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new OwnershipError(
    response.status === 409 ? 'This audio job is already running or completed.' : 'Unable to access this audio job.',
    [404, 409].includes(response.status) ? response.status : 502,
  );
  const data = await response.json();
  if (data.job_id !== jobId) throw new OwnershipError('Invalid audio job response.', 502);
  return data;
}

export const fetchAudioJobStatus = (jobId: string) => requestAudioJob(jobId);
export const retryAudioJob = (jobId: string) => requestAudioJob(jobId, true);

export async function syncOwnedAudioJob(context: OwnerContext, jobId: string) {
  const job = await requireOwnedAudioJob(context, jobId);
  const { user, sql } = context;
  let data;
  try { data = await fetchAudioJobStatus(jobId); }
  catch (error) {
    if (error instanceof OwnershipError && error.status === 404) {
      // Keep history, but don't re-import a missing gateway job every polling cycle.
      await sql`UPDATE generation_history SET parameters = COALESCE(parameters, '{}'::jsonb)
        || '{"gateway_job_missing":true}'::jsonb WHERE id = ${jobId} AND user_id = ${user.id}`;
    }
    throw error;
  }
  if (job.parameters?.gateway_job_missing) {
    await sql`UPDATE generation_history SET parameters = parameters - 'gateway_job_missing'
      WHERE id = ${jobId} AND user_id = ${user.id}`;
  }
  if (data.status === 'completed' && typeof data.audio_url === 'string' && data.audio_url) {
    const duration = data.duration_sec ?? data.duration_seconds ?? null;
    const size = data.size_bytes ?? null;
    await sql`UPDATE generation_history SET audio_url = ${data.audio_url}, duration_sec = COALESCE(${duration}, duration_sec),
      parameters = CASE WHEN ${size}::bigint IS NOT NULL THEN parameters || jsonb_build_object('size_bytes', ${size}::bigint) ELSE parameters END
      WHERE id = ${jobId} AND user_id = ${user.id}`;
    // Update only already-linked jobs in this user's templates. The browser cannot supply the URL.
    await sql`UPDATE json_templates SET audio_urls = (
      SELECT jsonb_agg(CASE WHEN entry->>'job_id' = ${jobId}
        THEN entry || jsonb_strip_nulls(jsonb_build_object('audio_url', ${data.audio_url}::text,
          'duration_sec', ${duration}::numeric, 'size_bytes', ${size}::bigint)) ELSE entry END)
      FROM jsonb_array_elements(
        CASE WHEN jsonb_typeof(audio_urls) = 'array' THEN audio_urls ELSE '[]'::jsonb END) AS entry
    ), updated_at = NOW()
    WHERE user_id = ${user.id} AND audio_urls @> ${JSON.stringify([{ job_id: jobId }])}::jsonb`;
  }
  return { ...data, voice_name: job.voice_name, model_id: job.model_id, duration_seconds: data.duration_sec ?? data.duration_seconds ?? job.duration_sec ?? null, error: data.error_message || data.error || null };
}
