import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/lib/auth/googleAuth';
import { deleteOwnedAudio } from '@/app/lib/deleteOwnedAudio';
import { ownershipErrorResponse } from '@/app/lib/auth/ownership';
import { getDb } from '@/app/lib/db';
import { inlineAudioMetadata } from '@/app/lib/audioMetadata';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ authenticated: false, items: [], total: 0 });
    }

    const sql = getDb();
    if (!sql) {
      return NextResponse.json({ authenticated: true, items: [], total: 0 });
    }

    const { searchParams } = new URL(request.url);

    // 1. On-demand single audio fetch for play / download (by job_id)
    const singleId = searchParams.get('id');
    if (singleId) {
      const rows = await sql`
        SELECT audio_url FROM generation_history
        WHERE user_id = ${user.id} AND id = ${singleId} AND COALESCE(audio_url, '') NOT IN ('', 'null')
        UNION ALL
        SELECT item->>'audio_url' AS audio_url
        FROM json_templates t,
             jsonb_array_elements(
               CASE WHEN jsonb_typeof(t.audio_urls) = 'array' THEN t.audio_urls ELSE '[]'::jsonb END
             ) AS item
        WHERE t.user_id = ${user.id}
          AND item->>'job_id' = ${singleId}
          AND item->>'audio_url' IS NOT NULL
          AND item->>'audio_url' != ''
          AND item->>'audio_url' != 'null'
        LIMIT 1
      `;
      if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json({ audio_url: rows[0].audio_url });
    }

    // Combine owned Studio history and template links, deduplicating by job ID.
    // Audio bytes/URLs are fetched only when the user plays or downloads an item.
    const search = searchParams.get('search')?.trim().toLowerCase() || '';
    const model = searchParams.get('model')?.trim() || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') || '10', 10) || 10));
    const offset = (page - 1) * pageSize;

    const rows = await sql`
      WITH owned_audio AS (
      SELECT id, NULL::text AS audio_id, model_id, model_name, voice_id, voice_name,
        created_at, LEFT(prompt_text, 50) AS prompt_text, duration_sec::text AS duration_sec,
        parameters->>'size_bytes' AS size_bytes,
        CASE WHEN audio_url LIKE 'data:%;base64,%' THEN LEFT(audio_url, 8192) END AS inline_audio,
        LENGTH(audio_url) AS inline_length, RIGHT(audio_url, 2) AS inline_tail, 0 AS source_priority
      FROM generation_history
      WHERE user_id = ${user.id} AND COALESCE(audio_url, '') NOT IN ('', 'null')
      UNION ALL
      SELECT
        item->>'job_id'                                        AS id,
        item->>'audio_id'                                      AS audio_id,
        item->>'model_id'                                      AS model_id,
        item->>'model_id'                                      AS model_name,
        item->>'voice_id'                                      AS voice_id,
        COALESCE(item->>'voice_name', item->>'voice_id')       AS voice_name,
        (item->>'created_at')::timestamptz                    AS created_at,
        CASE
          WHEN item->>'audio_id' = t.json_data->'content_strategy'->'long_video'->>'id'
            THEN LEFT(t.json_data->'content_strategy'->'long_video'->>'script', 50)
          ELSE (
            SELECT LEFT(s->>'script', 50)
            FROM jsonb_array_elements(
              CASE WHEN jsonb_typeof(t.json_data->'content_strategy'->'shorts') = 'array'
                   THEN t.json_data->'content_strategy'->'shorts'
                   ELSE '[]'::jsonb END
            ) s
            WHERE s->>'id' = item->>'audio_id'
            LIMIT 1
          )
        END                                                    AS prompt_text,
        COALESCE(item->>'duration_sec', item->>'duration_seconds') AS duration_sec,
        item->>'size_bytes' AS size_bytes,
        NULL::text AS inline_audio, NULL::integer AS inline_length, NULL::text AS inline_tail,
        1 AS source_priority
      FROM json_templates t,
           jsonb_array_elements(
             CASE WHEN jsonb_typeof(t.audio_urls) = 'array' THEN t.audio_urls ELSE '[]'::jsonb END
           ) AS item
      WHERE t.user_id = ${user.id}
        AND item->>'audio_url' IS NOT NULL
        AND item->>'audio_url' != ''
        AND item->>'audio_url' != 'null'
      ), unique_audio AS (
        SELECT DISTINCT ON (id) * FROM owned_audio
        WHERE COALESCE(id, '') != '' ORDER BY id, source_priority
      )
      SELECT id, audio_id, model_id, model_name, voice_id, voice_name, created_at, prompt_text,
        duration_sec, size_bytes, inline_audio, inline_length, inline_tail, COUNT(*) OVER() AS full_count
      FROM unique_audio
      WHERE (${search} = '' OR LOWER(CONCAT_WS(' ', voice_name, prompt_text, model_name)) LIKE ${'%' + search + '%'})
        AND (${model} = '' OR ${model} = 'all' OR LOWER(COALESCE(model_id, '')) LIKE ${'%' + model.toLowerCase() + '%'})
      ORDER BY created_at DESC NULLS LAST, id
      LIMIT ${pageSize} OFFSET ${offset}
    `;

    const total = rows.length > 0 ? parseInt(rows[0].full_count as string, 10) : 0;
    const items = rows.map((r) => {
      const item = { ...r };
      const metadata = inlineAudioMetadata(r.inline_audio, r.inline_length, r.inline_tail);
      item.duration_sec = Number(r.duration_sec) > 0 ? Number(r.duration_sec) : metadata?.duration_sec ?? null;
      item.size_bytes = Number(r.size_bytes) > 0 ? Number(r.size_bytes) : metadata?.size_bytes ?? null;
      delete item.full_count;
      delete item.inline_audio;
      delete item.inline_length;
      delete item.inline_tail;
      return item;
    });

    return NextResponse.json({
      authenticated: true,
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    console.error('Audio library fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch audios' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const ids = searchParams.get('ids')?.split(',').filter(Boolean);

    const sql = getDb();
    if (!sql) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    if (id) {
      await deleteOwnedAudio({ user, sql }, [id]);
      return NextResponse.json({ success: true, deletedId: id });
    }

    if (ids && ids.length > 0) {
      await deleteOwnedAudio({ user, sql }, ids);
      return NextResponse.json({ success: true, deletedIds: ids });
    }

    return NextResponse.json({ error: 'Missing audio id' }, { status: 400 });
  } catch (error) {
    console.error('Audio library delete error:', error);
    return ownershipErrorResponse(error);
  }
}
