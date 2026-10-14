import { NextRequest, NextResponse } from 'next/server';
import { gatewayHeaders } from '@/app/lib/gatewayHeaders';
import { requireUser, ownershipErrorResponse, OwnershipError } from '@/app/lib/auth/ownership';
import { checkMetaAccountLimit } from '@/app/lib/credits';


// POST /api/facebook/store-token - Store Page token, link Instagram profile, and proxy to FastAPI
export async function POST(request: NextRequest) {
  try {
    const context = await requireUser();
    const { user, sql } = context;
    const userId = user.id;
    const body = await request.json();
    const { page_id, access_token } = body;

    if (!page_id || !access_token) {
      return NextResponse.json(
        { error: 'Missing page_id or access_token' },
        { status: 400 }
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
    let verifiedPageName = '';
    let pageCategory = '';
    let pictureUrl = '';
    let instagramId = null;
    let instagramUsername = null;
    let instagramPic = null;

    try {
      const graphUrl = `https://graph.facebook.com/v20.0/me?fields=id,name,category,picture{url},instagram_business_account{id,username,profile_picture_url}`;
      const graphRes = await fetch(graphUrl, { headers: { Authorization: `Bearer ${access_token}` }, cache: 'no-store' });
      if (!graphRes.ok) throw new OwnershipError('Unable to verify page access.', 403);
      if (graphRes.ok) {
        const graphData = await graphRes.json();
        if (String(graphData.id) !== String(page_id)) throw new OwnershipError('Page token does not match the selected page.', 403);
        verifiedPageName = graphData.name || 'Facebook Page';
        pageCategory = graphData.category || '';
        pictureUrl = graphData.picture?.data?.url || '';
        if (graphData.instagram_business_account) {
          instagramId = graphData.instagram_business_account.id || null;
          instagramUsername = graphData.instagram_business_account.username || null;
          instagramPic = graphData.instagram_business_account.profile_picture_url || null;
        }
      }
    } catch (graphErr) {
      throw graphErr;
    }

    // 3. Proxy token securely to FastAPI server
    const apiUrl = process.env.VOICEOVER_API_URL || 'http://localhost:8000';
    let fastApiResponse = null;

    try {
      const fastApiRes = await fetch(`${apiUrl}/api/v1/facebook/store-token`, {
        method: 'POST',
        headers: gatewayHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          page_id,
          page_name: verifiedPageName,
          access_token,
        }),
      });

      if (!fastApiRes.ok) {
        throw new OwnershipError('Unable to connect this page.', 502);
      } else {
        fastApiResponse = await fastApiRes.json();
      }
    } catch (fastApiErr) {
      throw fastApiErr;
    }


    // 2. Upsert into Neon DB `facebook_pages`
    if (sql) {
      const recordId = `${userId}_${page_id}`;
      await sql`
        INSERT INTO facebook_pages (
          id, user_id, page_id, page_name, page_category, picture_url,
          instagram_business_account_id, instagram_username, instagram_profile_picture_url,
          is_active, created_at, updated_at
        ) VALUES (
          ${recordId}, ${userId}, ${page_id}, ${verifiedPageName}, ${pageCategory}, ${pictureUrl},
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

    return NextResponse.json({
      status: 'success',
      message: 'Page token stored and connected successfully',
      instagram_connected: Boolean(instagramId),
      instagram_username: instagramUsername,
      fastapi: fastApiResponse,
    });
  } catch (error) {
    console.error('Error in /api/facebook/store-token:', error);
    return ownershipErrorResponse(error);
  }
}
