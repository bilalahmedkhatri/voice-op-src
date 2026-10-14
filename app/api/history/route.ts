import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/lib/auth/googleAuth';
import { deleteOwnedAudio } from '@/app/lib/deleteOwnedAudio';
import { ownershipErrorResponse } from '@/app/lib/auth/ownership';
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

    const pendingOnly = request.nextUrl.searchParams.get('pending') === 'true';
    const rows = await sql`
      SELECT id, user_id, prompt_text, model_id, model_name, voice_id, voice_name, audio_url, duration_sec, generation_time_sec, parameters, created_at
      FROM generation_history
      WHERE user_id = ${user.id}
        AND (${pendingOnly} = false OR (
          parameters->>'server_owned_job' = 'true' AND (audio_url IS NULL OR audio_url = '')
          AND COALESCE(parameters->>'gateway_job_missing', 'false') != 'true'
        ))
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
      await deleteOwnedAudio({ user, sql }, [], true);
      return NextResponse.json({ success: true, message: 'All history cleared' });
    }

    if (id) {
      await deleteOwnedAudio({ user, sql }, [id]);
      return NextResponse.json({ success: true, message: 'Item deleted' });
    }

    return NextResponse.json({ error: 'Missing id or clear_all param' }, { status: 400 });
  } catch (error) {
    console.error('Error deleting history:', error);
    return ownershipErrorResponse(error);
  }
}
