import type { OwnerContext } from './auth/ownership';

export async function linkOwnedAudioJob(context: OwnerContext, templateId: string, itemId: string, job: Record<string, unknown>) {
  const audioRecord = {
    job_id: job.id, audio_id: itemId, model_id: job.model_id,
    voice_id: job.voice_id, voice_name: job.voice_name,
    audio_url: job.audio_url ?? null, created_at: job.created_at,
    duration_sec: job.duration_sec ?? null,
    size_bytes: (job.parameters as Record<string, unknown> | undefined)?.size_bytes ?? null,
  };
  const { user, sql } = context;
  // Atomic update preserves parallel generations on the same template.
  await sql`UPDATE json_templates SET audio_urls = COALESCE((
    SELECT jsonb_agg(entry) FROM jsonb_array_elements(
      CASE WHEN jsonb_typeof(audio_urls) = 'array' THEN audio_urls ELSE '[]'::jsonb END) AS entry
    WHERE entry->>'job_id' IS DISTINCT FROM ${String(job.id)}
  ), '[]'::jsonb) || ${JSON.stringify([audioRecord])}::jsonb,
    updated_by = ${user.id}, updated_at = NOW()
    WHERE id = ${templateId} AND user_id = ${user.id}
      AND (audio_urls IS NULL OR audio_urls IN ('null'::jsonb, '{}'::jsonb) OR jsonb_typeof(audio_urls) = 'array')`;
  return audioRecord;
}
