import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/lib/auth/googleAuth';
import { getDb } from '@/app/lib/db';

async function resolveUserId(): Promise<string | null> {
  const user = await getCurrentUser();
  if (user?.id) return user.id;

  const sql = getDb();
  if (sql) {
    return null; // Require login when database is enabled
  }
  return 'local_user';
}

// GET /api/facebook/pages - Fetch connected Facebook Pages & Instagram accounts
export async function GET() {
  try {
    const sql = getDb();
    if (!sql) {
      return NextResponse.json({ pages: [] });
    }

    const userId = await resolveUserId();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized: Please log in to view connected pages', pages: [] },
        { status: 401 }
      );
    }

    const pages = await sql`
      SELECT 
        id,
        user_id,
        page_id,
        page_name,
        page_category,
        picture_url,
        instagram_business_account_id,
        instagram_username,
        instagram_profile_picture_url,
        is_active,
        created_at,
        updated_at
      FROM facebook_pages
      WHERE user_id = ${userId} AND is_active = TRUE
      ORDER BY created_at DESC
    `;

    return NextResponse.json({
      success: true,
      pages: pages || []
    });
  } catch (error: any) {
    console.error('Error fetching connected Facebook pages:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch connected pages', pages: [] },
      { status: 500 }
    );
  }
}

// DELETE /api/facebook/pages?page_id=xyz - Disconnect a Facebook page
export async function DELETE(request: NextRequest) {
  try {
    const sql = getDb();
    if (!sql) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
    }

    const userId = await resolveUserId();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized: Please log in to manage pages' },
        { status: 401 }
      );
    }
    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('page_id');

    if (!pageId) {
      return NextResponse.json({ error: 'Missing page_id parameter' }, { status: 400 });
    }

    await sql`
      UPDATE facebook_pages
      SET is_active = FALSE, updated_at = NOW()
      WHERE user_id = ${userId} AND page_id = ${pageId}
    `;

    return NextResponse.json({ success: true, message: 'Page disconnected successfully' });
  } catch (error: any) {
    console.error('Error disconnecting Facebook page:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to disconnect page' },
      { status: 500 }
    );
  }
}
