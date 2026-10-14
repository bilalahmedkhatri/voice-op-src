import { OwnershipError, type OwnerContext } from './auth/ownership';

export async function deleteOwnedAudio(context: OwnerContext, ids: string[], clearAll = false) {
  const { sql, user } = context;
  const removed = await sql`UPDATE json_templates SET audio_urls = COALESCE((
    SELECT jsonb_agg(entry) FROM jsonb_array_elements(
      CASE WHEN jsonb_typeof(audio_urls) = 'array' THEN audio_urls ELSE '[]'::jsonb END) entry
    WHERE NOT (${clearAll} OR COALESCE(entry->>'job_id' = ANY(${ids}::text[]), FALSE))
  ), '[]'::jsonb), updated_at = NOW()
  WHERE user_id = ${user.id} AND jsonb_typeof(audio_urls) = 'array' AND (${clearAll} OR EXISTS (
    SELECT 1 FROM jsonb_array_elements(
      CASE WHEN jsonb_typeof(audio_urls) = 'array' THEN audio_urls ELSE '[]'::jsonb END) entry
    WHERE entry->>'job_id' = ANY(${ids}::text[])
  )) RETURNING id`;
  const history = await sql`DELETE FROM generation_history
    WHERE user_id = ${user.id} AND (${clearAll} OR id = ANY(${ids}::text[])) RETURNING id`;
  if (!clearAll && !removed.length && !history.length) throw new OwnershipError('Audio not found.', 404);
}
