import { NextRequest, NextResponse } from 'next/server';
import { requireUser, ownershipErrorResponse } from '@/app/lib/auth/ownership';


// DELETE /api/facebook/posts/[id] - Cancel/delete scheduled post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const context = await requireUser();
    const { user, sql } = context;
    const userId = user.id;


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
  } catch (error) {
    console.error('Error cancelling scheduled post:', error);
    return ownershipErrorResponse(error);
  }
}

// PATCH /api/facebook/posts/[id] - Reschedule or update caption
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const context = await requireUser();
    const { user, sql } = context;
    const userId = user.id;
    const body = await request.json();
    const { scheduled_publish_time, message } = body;


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
  } catch (error) {
    console.error('Error updating scheduled post:', error);
    return ownershipErrorResponse(error);
  }
}
