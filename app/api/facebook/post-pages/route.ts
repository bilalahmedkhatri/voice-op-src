import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/lib/auth/googleAuth';
import { getDb } from '@/app/lib/db';
import { verifyCreditBalance, deductCredits, ActionType } from '@/app/lib/credits';

async function resolveUserId(): Promise<string | null> {
  const user = await getCurrentUser();
  if (user?.id) return user.id;

  const sql = getDb();
  if (sql) {
    return null; // Require login when database is enabled
  }
  return 'local_user';
}

export async function POST(request: NextRequest) {
  try {
    const userId = await resolveUserId();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized: Please log in to post or schedule to Facebook' },
        { status: 401 }
      );
    }
    const incomingFormData = await request.formData();

    const pageId = incomingFormData.get('page_id') as string;
    const message = incomingFormData.get('message') as string;
    const scheduledPublishTimeRaw = incomingFormData.get('scheduled_publish_time') as string | null;
    const buttonType = incomingFormData.get('button_type') as string | null;
    const buttonLink = incomingFormData.get('button_link') as string | null;
    const destination = (incomingFormData.get('destination') as string) || 'facebook';
    const postType = (incomingFormData.get('post_type') as string) || 'reel';
    const title = (incomingFormData.get('title') as string) || null;
    const templateId = (incomingFormData.get('template_id') as string) || null;
    const contentItemId = (incomingFormData.get('content_item_id') as string) || null;
    const mediaFile = incomingFormData.get('media') as File | null;

    if (!pageId) {
      return NextResponse.json({ error: 'Page ID is required' }, { status: 400 });
    }
    if (!message && (!mediaFile || mediaFile.size === 0)) {
      return NextResponse.json({ error: 'Post message or media is required' }, { status: 400 });
    }

    const isFullAutomation =
      incomingFormData.get('is_full_automation') === 'true' ||
      incomingFormData.get('workflow') === 'full_automation';
    const creditAction: ActionType = isFullAutomation ? 'full_automation' : 'social_schedule';

    // Strict balance check before calling FastAPI or Meta
    const creditCheck = await verifyCreditBalance(userId, creditAction);
    if (!creditCheck.ok) {
      return NextResponse.json(
        {
          error: creditCheck.error,
          code: creditCheck.code || 'INSUFFICIENT_CREDITS',
          requiredCredits: creditCheck.requiredCredits,
          availableCredits: creditCheck.availableCredits,
          tier: creditCheck.tier,
        },
        { status: 402 }
      );
    }

    // Validate Meta schedule bounds (10 minutes to 75 days)
    let scheduledTimestamp: number | null = null;
    if (scheduledPublishTimeRaw) {
      scheduledTimestamp = parseInt(scheduledPublishTimeRaw, 10);
      const now = Math.floor(Date.now() / 1000);
      const minSchedule = now + 600; // 10 minutes
      const maxSchedule = now + 75 * 24 * 3600; // 75 days

      if (scheduledTimestamp < minSchedule) {
        return NextResponse.json(
          { error: 'Meta requires scheduled posts to be at least 10 minutes in the future.' },
          { status: 400 }
        );
      }
      if (scheduledTimestamp > maxSchedule) {
        return NextResponse.json(
          { error: 'Meta allows scheduling up to 75 days in advance.' },
          { status: 400 }
        );
      }
    }

    // Prepare outbound FormData to FastAPI (port 8000)
    const apiUrl = process.env.VOICEOVER_API_URL || 'http://localhost:8000';
    const forwardFormData = new FormData();
    forwardFormData.append('page_id', pageId);
    forwardFormData.append('message', message || '');

    if (scheduledTimestamp) {
      forwardFormData.append('scheduled_publish_time', scheduledTimestamp.toString());
    }
    if (buttonType) {
      forwardFormData.append('button_type', buttonType);
    }
    if (buttonLink) {
      forwardFormData.append('button_link', buttonLink);
    }
    if (mediaFile && mediaFile.size > 0) {
      forwardFormData.append('media', mediaFile, mediaFile.name);
    }

    const fastApiResponse = await fetch(`${apiUrl}/api/v1/facebook/post-pages`, {
      method: 'POST',
      body: forwardFormData,
    });

    const responseData = await fastApiResponse.json();

    if (!fastApiResponse.ok || responseData.status !== 'success') {
      const errorMsg =
        responseData.detail ||
        responseData.error ||
        responseData.message ||
        'Failed to publish or schedule post via FastAPI';
      return NextResponse.json({ error: errorMsg }, { status: fastApiResponse.status || 400 });
    }

    // Post succeeded on FastAPI & Facebook. Now record in Neon DB scheduled_posts!
    const sql = getDb();
    if (sql) {
      // Look up page name
      const pageRows = await sql`
        SELECT page_name FROM facebook_pages WHERE user_id = ${userId} AND page_id = ${pageId} LIMIT 1
      `;
      const pageName = pageRows.length > 0 ? pageRows[0].page_name : 'Connected Page';

      const postId = `post_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const status = scheduledTimestamp ? 'scheduled' : 'published';
      const scheduledDate = scheduledTimestamp ? new Date(scheduledTimestamp * 1000).toISOString() : null;

      await sql`
        INSERT INTO scheduled_posts (
          id, user_id, page_id, page_name, destination, post_type,
          title, message, scheduled_publish_time, status, fb_post_id,
          template_id, content_item_id, created_at, updated_at
        ) VALUES (
          ${postId}, ${userId}, ${pageId}, ${pageName}, ${destination}, ${postType},
          ${title}, ${message || ''}, ${scheduledDate}, ${status}, ${responseData.post_id || null},
          ${templateId}, ${contentItemId}, NOW(), NOW()
        )
      `;
    }

    // Deduct credits atomically upon successful post/schedule
    let remainingCredits: number | null = null;
    try {
      const deductRes = await deductCredits(userId, creditAction, {
        description: isFullAutomation
          ? `Full 1-Click Automated Reel (${destination})`
          : `Meta ${postType} schedule (${destination})`,
        referenceId: responseData.post_id || null,
        metadata: { pageId, destination, postType, scheduled: Boolean(scheduledTimestamp) },
      });
      remainingCredits = deductRes.balanceAfter;
    } catch (err) {
      console.error('Failed to deduct credits for Meta schedule:', err);
    }

    return NextResponse.json({
      status: 'success',
      post_id: responseData.post_id,
      scheduled: Boolean(scheduledTimestamp),
      remaining_credits: remainingCredits,
      message: scheduledTimestamp
        ? 'Post scheduled successfully on Facebook & registered in database.'
        : 'Post published successfully on Facebook.',
    });
  } catch (error: any) {
    console.error('Error in /api/facebook/post-pages:', error);
    return NextResponse.json(
      { error: error.message || 'Internal error communicating with Facebook server' },
      { status: 500 }
    );
  }
}
