import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/lib/auth/googleAuth';
import { getDb } from '@/app/lib/db';
import { checkMetaAccountLimit } from '@/app/lib/credits';

async function resolveUserId(): Promise<string | null> {
  const user = await getCurrentUser();
  if (user?.id) return user.id;

  const sql = getDb();
  if (sql) {
    return null; // Require login when database is enabled
  }
  return 'local_user';
}

// POST /api/facebook/store-token - Store Page token, link Instagram profile, and proxy to FastAPI
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { page_id, page_name, access_token } = body;

    if (!page_id || !access_token) {
      return NextResponse.json(
        { error: 'Missing page_id or access_token' },
        { status: 400 }
      );
    }

    const userId = await resolveUserId();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized: Please log in to connect Facebook pages' },
        { status: 401 }
      );
    }

    // Enforce tier-based Meta account limits (Free: 1, Starter: 3, Pro: 10)
    const limitCheck = await checkMetaAccountLimit(userId, page_id);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          error: limitCheck.error,
          code: 'TIER_LIMIT_REACHED',
          currentCount: limitCheck.currentCount,
          maxAllowed: limitCheck.maxAllowed,
          tier: limitCheck.tier,
        },
        { status: 403 }
      );
    }

    // 1. Query Meta Graph API for page metadata and linked Instagram account
    let pageCategory = '';
    let pictureUrl = '';
    let instagramId = null;
    let instagramUsername = null;
    let instagramPic = null;

    try {
      const graphUrl = `https://graph.facebook.com/v20.0/${page_id}?fields=id,name,category,picture{url},instagram_business_account{id,username,profile_picture_url}&access_token=${access_token}`;
      const graphRes = await fetch(graphUrl);
      if (graphRes.ok) {
        const graphData = await graphRes.json();
        pageCategory = graphData.category || '';
        pictureUrl = graphData.picture?.data?.url || '';
        if (graphData.instagram_business_account) {
          instagramId = graphData.instagram_business_account.id || null;
          instagramUsername = graphData.instagram_business_account.username || null;
          instagramPic = graphData.instagram_business_account.profile_picture_url || null;
        }
      }
    } catch (graphErr) {
      console.warn('Could not fetch extra Graph API info for page:', graphErr);
    }

    // 2. Upsert into Neon DB `facebook_pages`
    const sql = getDb();
    if (sql) {
      const recordId = `${userId}_${page_id}`;
      await sql`
        INSERT INTO facebook_pages (
          id, user_id, page_id, page_name, page_category, picture_url,
          instagram_business_account_id, instagram_username, instagram_profile_picture_url,
          is_active, created_at, updated_at
        ) VALUES (
          ${recordId}, ${userId}, ${page_id}, ${page_name || 'Facebook Page'}, ${pageCategory}, ${pictureUrl},
          ${instagramId}, ${instagramUsername}, ${instagramPic},
          TRUE, NOW(), NOW()
        )
        ON CONFLICT (user_id, page_id) DO UPDATE SET
          page_name = EXCLUDED.page_name,
          page_category = EXCLUDED.page_category,
          picture_url = EXCLUDED.picture_url,
          instagram_business_account_id = EXCLUDED.instagram_business_account_id,
          instagram_username = EXCLUDED.instagram_username,
          instagram_profile_picture_url = EXCLUDED.instagram_profile_picture_url,
          is_active = TRUE,
          updated_at = NOW();
      `;
    }

    // 3. Proxy token securely to FastAPI server
    const apiUrl = process.env.VOICEOVER_API_URL || 'http://localhost:8000';
    let fastApiResponse = null;

    try {
      const fastApiRes = await fetch(`${apiUrl}/api/v1/facebook/store-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page_id,
          page_name,
          access_token,
        }),
      });

      if (!fastApiRes.ok) {
        const errText = await fastApiRes.text();
        console.warn('FastAPI store-token warning:', errText);
      } else {
        fastApiResponse = await fastApiRes.json();
      }
    } catch (fastApiErr) {
      console.warn('FastAPI server connection error:', fastApiErr);
    }

    return NextResponse.json({
      status: 'success',
      message: 'Page token stored and connected successfully',
      instagram_connected: Boolean(instagramId),
      instagram_username: instagramUsername,
      fastapi: fastApiResponse,
    });
  } catch (error: any) {
    console.error('Error in /api/facebook/store-token:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error while storing token' },
      { status: 500 }
    );
  }
}
