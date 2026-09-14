import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/lib/auth/googleAuth';
import { getDb } from '@/app/lib/db';
import { isDatabaseEnabled } from '@/app/lib/config';

// GET /api/presets - Fetch user's saved voice presets
export async function GET() {
  if (!isDatabaseEnabled()) {
    return NextResponse.json({ authenticated: false, presets: [] });
  }

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ authenticated: false, presets: [] });
    }

    const sql = getDb();
    if (!sql) {
      return NextResponse.json({ authenticated: true, presets: [] });
    }

    const rows = await sql`
      SELECT id, preset_name, model_id, voice_id, voice_name, language, gender, parameters, created_at
      FROM voice_presets
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
      LIMIT 50
    `;

    return NextResponse.json({
      authenticated: true,
      presets: rows || [],
    });
  } catch (error: any) {
    console.error('Error fetching voice presets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch presets', presets: [] },
      { status: 500 }
    );
  }
}

// POST /api/presets - Save a new voice preset
export async function POST(request: NextRequest) {
  if (!isDatabaseEnabled()) {
    return NextResponse.json({ error: 'Database mode is disabled' }, { status: 400 });
  }

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sql = getDb();
    if (!sql) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    const body = await request.json();
    const {
      preset_name,
      model_id,
      voice_id,
      voice_name,
      language = 'EN',
      gender = 'Female',
      parameters = {},
    } = body;

    if (!preset_name || !voice_id || !model_id) {
      return NextResponse.json(
        { error: 'Preset name, voice ID, and model ID are required.' },
        { status: 400 }
      );
    }

    const presetId = `pre_${crypto.randomUUID().replace(/-/g, '')}`;

    await sql`
      INSERT INTO voice_presets (
        id, user_id, preset_name, model_id, voice_id, voice_name, language, gender, parameters, created_at
      )
      VALUES (
        ${presetId},
        ${user.id},
        ${preset_name},
        ${model_id},
        ${voice_id},
        ${voice_name || voice_id},
        ${language},
        ${gender},
        ${JSON.stringify(parameters)},
        NOW()
      )
    `;

    return NextResponse.json({
      success: true,
      preset: {
        id: presetId,
        preset_name,
        model_id,
        voice_id,
        voice_name: voice_name || voice_id,
        language,
        gender,
        parameters,
        created_at: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error saving voice preset:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to save preset' },
      { status: 500 }
    );
  }
}

// DELETE /api/presets - Delete a voice preset
export async function DELETE(request: NextRequest) {
  if (!isDatabaseEnabled()) {
    return NextResponse.json({ error: 'Database mode is disabled' }, { status: 400 });
  }

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sql = getDb();
    if (!sql) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Preset ID is required' }, { status: 400 });
    }

    await sql`
      DELETE FROM voice_presets
      WHERE id = ${id} AND user_id = ${user.id}
    `;

    return NextResponse.json({ success: true, message: 'Preset deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting preset:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete preset' },
      { status: 500 }
    );
  }
}
