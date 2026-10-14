import { NextRequest, NextResponse } from 'next/server';
import { requireUser, requireOwnedFacebookPage, ownershipErrorResponse } from '@/app/lib/auth/ownership';


// GET /api/facebook/pages - Fetch connected Facebook Pages & Instagram accounts
export async function GET() {
  try {
    const { user, sql } = await requireUser();
    const userId = user.id;

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
  } catch (error) {
    console.error('Error fetching connected Facebook pages:', error);
    return ownershipErrorResponse(error);
  }
}

// DELETE /api/facebook/pages?page_id=xyz - Disconnect a Facebook page
export async function DELETE(request: NextRequest) {
  try {
    const { user, sql } = await requireUser();
    const userId = user.id;
    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('page_id');

    if (!pageId) {
      return NextResponse.json({ error: 'Missing page_id parameter' }, { status: 400 });
    }

    if (pageId === 'all') {
      await sql`
        UPDATE facebook_pages
        SET is_active = FALSE, updated_at = NOW()
        WHERE user_id = ${userId}
      `;
      return NextResponse.json({ success: true, message: 'All pages disconnected successfully' });
    }

    await requireOwnedFacebookPage({ user, sql }, pageId);
    await sql`
      UPDATE facebook_pages
      SET is_active = FALSE, updated_at = NOW()
      WHERE user_id = ${userId} AND page_id = ${pageId}
    `;

    return NextResponse.json({ success: true, message: 'Page disconnected successfully' });
  } catch (error) {
    console.error('Error disconnecting Facebook page:', error);
    return ownershipErrorResponse(error);
  }
}
