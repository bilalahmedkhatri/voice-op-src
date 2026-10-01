import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/lib/auth/googleAuth';
import { getDb } from '@/app/lib/db';
import { isDatabaseEnabled } from '@/app/lib/config';

// GET /api/settings - Fetch current user's profile
export async function GET() {
  if (!isDatabaseEnabled()) {
    return NextResponse.json({ authenticated: false, user: null });
  }

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    const sql = getDb();
    if (!sql) {
      return NextResponse.json({ authenticated: true, user });
    }

    // Fetch fresh profile from DB
    const rows = await sql`
      SELECT id, email, name, image, google_id, created_at, updated_at
      FROM users
      WHERE id = ${user.id}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    // Fetch quota as well
    const quotaRows = await sql`
      SELECT generations_used, max_daily_generations, max_chars_per_request, chars_used_today, max_daily_chars, reset_at
      FROM user_quotas
      WHERE user_id = ${user.id}
      LIMIT 1
    `;

    // Fetch total saved templates count for this user
    const templateCountRows = await sql`
      SELECT COUNT(*)::int as total
      FROM json_templates
      WHERE user_id = ${user.id}
    `;
    const totalTemplates = templateCountRows[0]?.total ?? 0;

    return NextResponse.json({
      authenticated: true,
      user: rows[0],
      quota: quotaRows[0] ?? null,
      total_templates: totalTemplates,
    });
  } catch (error: any) {
    console.error('Error fetching user settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

// PATCH /api/settings - Update the authenticated user's display name
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
    const { name } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Name is required and must be a non-empty string.' }, { status: 400 });
    }

    const trimmedName = name.trim().substring(0, 100); // max 100 chars

    const updated = await sql`
      UPDATE users
      SET name = ${trimmedName}, updated_at = NOW()
      WHERE id = ${user.id}
      RETURNING id, email, name, image, google_id, created_at, updated_at
    `;

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: updated[0],
    });
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update profile' },
      { status: 500 }
    );
  }
}
