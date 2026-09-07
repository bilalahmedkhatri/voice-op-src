import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/lib/auth/googleAuth';
import { getDb } from '@/app/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ authenticated: false, items: [] });
    }

    const sql = getDb();
    if (!sql) {
      return NextResponse.json({ authenticated: true, items: [] });
    }

    const rows = await sql`
      SELECT id, user_id, prompt_text, model_id, model_name, voice_id, voice_name, audio_url, duration_sec, generation_time_sec, parameters, created_at
      FROM generation_history
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
      LIMIT 50
    `;

    return NextResponse.json({
      authenticated: true,
      items: rows,
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      prompt_text,
      model_id,
      model_name,
      voice_id,
      voice_name,
      audio_url,
      duration_sec,
      generation_time_sec,
      parameters = {},
    } = body;

    if (!prompt_text || !voice_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const sql = getDb();
    if (!sql) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    const id = `gh_${crypto.randomUUID().replace(/-/g, '')}`;

    const inserted = await sql`
      INSERT INTO generation_history (
        id, user_id, prompt_text, model_id, model_name, voice_id, voice_name, audio_url, duration_sec, generation_time_sec, parameters, created_at
      )
      VALUES (
        ${id},
        ${user.id},
        ${prompt_text},
        ${model_id || 'kokoro-82m'},
        ${model_name || 'Kokoro 82M'},
        ${voice_id},
        ${voice_name || voice_id},
        ${audio_url || null},
        ${duration_sec || null},
        ${generation_time_sec || null},
        ${JSON.stringify(parameters)},
        NOW()
      )
      RETURNING *
    `;

    // Update characters and generation counts in user_quotas
    const charCount = prompt_text.length;
    await sql`
      UPDATE user_quotas
      SET generations_used = generations_used + 1,
          chars_used_today = chars_used_today + ${charCount},
          updated_at = NOW()
      WHERE user_id = ${user.id}
    `;

    return NextResponse.json({ success: true, item: inserted[0] });
  } catch (error) {
    console.error('Error saving history item:', error);
    return NextResponse.json({ error: 'Failed to save history' }, { status: 500 });
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
    const clearAll = searchParams.get('clear_all') === 'true';

    const sql = getDb();
    if (!sql) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    if (clearAll) {
      await sql`DELETE FROM generation_history WHERE user_id = ${user.id}`;
      return NextResponse.json({ success: true, message: 'All history cleared' });
    }

    if (id) {
      await sql`DELETE FROM generation_history WHERE id = ${id} AND user_id = ${user.id}`;
      return NextResponse.json({ success: true, message: 'Item deleted' });
    }

    return NextResponse.json({ error: 'Missing id or clear_all param' }, { status: 400 });
  } catch (error) {
    console.error('Error deleting history:', error);
    return NextResponse.json({ error: 'Failed to delete history' }, { status: 500 });
  }
}
