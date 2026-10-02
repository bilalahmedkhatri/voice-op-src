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

// DELETE /api/facebook/posts/[id] - Cancel/delete scheduled post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = await resolveUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: Please log in first' }, { status: 401 });
    }
    const sql = getDb();

    if (!sql) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
    }

    const postRows = await sql`
      SELECT id, user_id, page_id, fb_post_id, status
      FROM scheduled_posts
      WHERE id = ${id} AND user_id = ${userId}
      LIMIT 1
    `;

    if (postRows.length === 0) {
      return NextResponse.json({ error: 'Post not found or unauthorized' }, { status: 404 });
    }

    const post = postRows[0];

    // Mark as cancelled in DB
    await sql`
      UPDATE scheduled_posts
      SET status = 'cancelled', updated_at = NOW()
      WHERE id = ${id} AND user_id = ${userId}
    `;

    return NextResponse.json({
      status: 'success',
      message: 'Scheduled post cancelled successfully',
      id: post.id
    });
  } catch (error: any) {
    console.error('Error cancelling scheduled post:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cancel post' },
      { status: 500 }
    );
  }
}

// PATCH /api/facebook/posts/[id] - Reschedule or update caption
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = await resolveUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: Please log in first' }, { status: 401 });
    }
    const body = await request.json();
    const { scheduled_publish_time, message } = body;
    const sql = getDb();

    if (!sql) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
    }

    const postRows = await sql`
      SELECT id, user_id, page_id, fb_post_id, status
      FROM scheduled_posts
      WHERE id = ${id} AND user_id = ${userId}
      LIMIT 1
    `;

    if (postRows.length === 0) {
      return NextResponse.json({ error: 'Post not found or unauthorized' }, { status: 404 });
    }

    let scheduledDate = null;
    if (scheduled_publish_time) {
      scheduledDate = new Date(scheduled_publish_time * 1000).toISOString();
    }

    await sql`
      UPDATE scheduled_posts
      SET 
        scheduled_publish_time = COALESCE(${scheduledDate}, scheduled_publish_time),
        message = COALESCE(${message}, message),
        updated_at = NOW()
      WHERE id = ${id} AND user_id = ${userId}
    `;

    return NextResponse.json({
      status: 'success',
      message: 'Post updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating scheduled post:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update post' },
      { status: 500 }
    );
  }
}
