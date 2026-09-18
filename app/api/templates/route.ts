import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/lib/auth/googleAuth';
import { getDb } from '@/app/lib/db';
import { isDatabaseEnabled } from '@/app/lib/config';

// GET /api/templates - Fetch all saved JSON templates
export async function GET(request: NextRequest) {
  if (!isDatabaseEnabled()) {
    return NextResponse.json({ authenticated: false, templates: [] });
  }

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ authenticated: false, templates: [] });
    }

    const sql = getDb();
    if (!sql) {
      return NextResponse.json({ authenticated: true, templates: [] });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const rows = await sql`
        SELECT id, json_data, status, confirmed_by_email, view_count, updated_by, created_at, updated_at
        FROM json_templates
        WHERE id = ${id}
      `;
      if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      
      return NextResponse.json({
        authenticated: true,
        template: rows[0],
      });
    }

    const rows = await sql`
      SELECT id, json_data, status, confirmed_by_email, view_count, updated_by, created_at, updated_at
      FROM json_templates
      ORDER BY created_at DESC
      LIMIT 100
    `;

    return NextResponse.json({
      authenticated: true,
      templates: rows || [],
    });
  } catch (error: any) {
    console.error('Error fetching JSON templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates', templates: [] },
      { status: 500 }
    );
  }
}

// POST /api/templates - Save a new JSON template
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
    const { json_data } = body;

    if (!json_data || typeof json_data !== 'object') {
      return NextResponse.json(
        { error: 'json_data is required and must be a valid JSON object.' },
        { status: 400 }
      );
    }

    const templateId = `tpl_${crypto.randomUUID().replace(/-/g, '')}`;
    const now = new Date().toISOString();

    await sql`
      INSERT INTO json_templates (
        id, json_data, status, updated_by, created_at, updated_at
      )
      VALUES (
        ${templateId},
        ${JSON.stringify(json_data)},
        'pending',
        ${user.id},
        NOW(),
        NOW()
      )
    `;

    return NextResponse.json({
      success: true,
      template: {
        id: templateId,
        json_data,
        status: 'pending',
        updated_by: user.id,
        created_at: now,
        updated_at: now,
      },
    });
  } catch (error: any) {
    console.error('Error saving JSON template:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to save template' },
      { status: 500 }
    );
  }
}

// PATCH /api/templates - Update status or view_count of a template
export async function PATCH(request: NextRequest) {
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
    const { id, status, confirmed_by_email, json_data } = body;

    if (!id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    await sql`
      UPDATE json_templates
      SET
        status = COALESCE(${status ?? null}, status),
        confirmed_by_email = COALESCE(${confirmed_by_email ?? null}, confirmed_by_email),
        json_data = COALESCE(${json_data ? JSON.stringify(json_data) : null}::jsonb, json_data),
        updated_by = ${user.id},
        updated_at = NOW()
      WHERE id = ${id}
    `;

    return NextResponse.json({ success: true, message: 'Template updated successfully' });
  } catch (error: any) {
    console.error('Error updating template:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update template' },
      { status: 500 }
    );
  }
}

// DELETE /api/templates - Delete a template
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
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    await sql`
      DELETE FROM json_templates
      WHERE id = ${id}
    `;

    return NextResponse.json({ success: true, message: 'Template deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting template:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete template' },
      { status: 500 }
    );
  }
}
