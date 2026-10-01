import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/lib/auth/googleAuth';
import { getDb } from '@/app/lib/db';

async function resolveUserId(): Promise<string> {
  const user = await getCurrentUser();
  if (user?.id) return user.id;

  const sql = getDb();
  if (sql) {
    const existing = await sql`SELECT id FROM users ORDER BY created_at ASC LIMIT 1`;
    if (existing.length > 0) {
      return existing[0].id;
    }
  }
  return 'local_user';
}

// GET /api/facebook/posts - List scheduled and published posts for the user
export async function GET() {
  try {
    const sql = getDb();
    if (!sql) {
      return NextResponse.json({ posts: [] });
    }

    const userId = await resolveUserId();

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
  } catch (error: any) {
    console.error('Error fetching scheduled posts:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch scheduled posts', posts: [] },
      { status: 500 }
    );
  }
}
