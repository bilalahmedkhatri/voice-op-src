import { NextResponse } from 'next/server';
import { requireUser, ownershipErrorResponse } from '@/app/lib/auth/ownership';


// GET /api/facebook/posts - List scheduled and published posts for the user
export async function GET() {
  try {
    const { user, sql } = await requireUser();
    const userId = user.id;

    const posts = await sql`
      SELECT 
        id,
        user_id,
        page_id,
        page_name,
        destination,
        post_type,
        title,
        message,
        media_url,
        scheduled_publish_time,
        status,
        fb_post_id,
        ig_media_id,
        template_id,
        content_item_id,
        error_message,
        created_at,
        updated_at
      FROM scheduled_posts
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 100
    `;

    return NextResponse.json({
      success: true,
      posts: posts || []
    });
  } catch (error) {
    console.error('Error fetching scheduled posts:', error);
    return ownershipErrorResponse(error);
  }
}
