import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/lib/auth/googleAuth';
import { getDb } from '@/app/lib/db';
import { isDatabaseEnabled } from '@/app/lib/config';

// POST /api/templates/audio-job
// Adds / updates job_id in audio_urls JSONB for a template (ownership enforced)
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
    const { templateId, itemId, jobId } = body;

    if (!templateId || !itemId || !jobId) {
      return NextResponse.json({ error: 'templateId, itemId, and jobId are required' }, { status: 400 });
    }

    // Verify user owns this template
    const rows = await sql`
      SELECT audio_urls FROM json_templates WHERE id = ${templateId} AND user_id = ${user.id}
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Template not found or access denied' }, { status: 404 });
    }

    let audioUrls = rows[0].audio_urls;
    if (!audioUrls || !Array.isArray(audioUrls)) {
      audioUrls = [];
    }

    const existingIndex = audioUrls.findIndex((item: any) => item.audio_id === itemId);
    if (existingIndex >= 0) {
      audioUrls[existingIndex].job_id = jobId;
    } else {
      audioUrls.push({ audio_id: itemId, job_id: jobId });
    }

    await sql`
      UPDATE json_templates
      SET
        audio_urls = ${JSON.stringify(audioUrls)}::jsonb,
        updated_by = ${user.id},
        updated_at = NOW()
      WHERE id = ${templateId} AND user_id = ${user.id}
    `;

    return NextResponse.json({ success: true, message: 'Audio job saved successfully' });
  } catch (error: any) {
    console.error('Error saving audio job:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to save audio job' },
      { status: 500 }
    );
  }
}

// PUT /api/templates/audio-job
// Updates audio_url once the job completes (ownership enforced)
export async function PUT(request: NextRequest) {
  if (!isDatabaseEnabled()) {
    return NextResponse.json({ error: 'Database mode is disabled' }, { status: 400 });
  }

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sql = getDb();
    if (!sql) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });

    const body = await request.json();
    const { templateId, itemId, jobId, audioUrl } = body;

    if (!templateId || !itemId || !audioUrl) {
      return NextResponse.json({ error: 'templateId, itemId, and audioUrl are required' }, { status: 400 });
    }

    // Verify user owns this template
    const rows = await sql`SELECT audio_urls FROM json_templates WHERE id = ${templateId} AND user_id = ${user.id}`;
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Template not found or access denied' }, { status: 404 });
    }

    let audioUrls = rows[0].audio_urls || [];
    const existingIndex = audioUrls.findIndex((item: any) => item.audio_id === itemId);

    if (existingIndex >= 0) {
      audioUrls[existingIndex].audio_url = audioUrl;
    } else {
      audioUrls.push({ audio_id: itemId, job_id: jobId, audio_url: audioUrl });
    }

    await sql`
      UPDATE json_templates
      SET
        audio_urls = ${JSON.stringify(audioUrls)}::jsonb,
        updated_by = ${user.id},
        updated_at = NOW()
      WHERE id = ${templateId} AND user_id = ${user.id}
    `;

    return NextResponse.json({ success: true, message: 'Audio url updated successfully' });
  } catch (error: any) {
    console.error('Error updating audio url:', error);
    return NextResponse.json({ error: error?.message || 'Failed to update audio url' }, { status: 500 });
  }
}
