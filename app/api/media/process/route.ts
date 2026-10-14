import { NextRequest, NextResponse } from 'next/server';
import { gatewayHeaders } from '@/app/lib/gatewayHeaders';
import { requireUser, requireOwnedTemplateItem, ownershipErrorResponse } from '@/app/lib/auth/ownership';
import { fetchOwnedMedia, ownedMediaUrl } from '@/app/lib/ownedMedia';

export async function POST(request: NextRequest) {
  try {
    const context = await requireUser();
    const { user } = context;

    const payload = await request.json();
    const { item_id, template_id, keywords, urls, filters, quantity } = payload;

    if (!item_id) {
      return NextResponse.json({ error: 'Missing item_id' }, { status: 400 });
    }

    if (!urls && (!keywords || !Array.isArray(keywords))) {
      return NextResponse.json({ error: 'Missing urls or invalid keywords' }, { status: 400 });
    }

    await requireOwnedTemplateItem(context, template_id, item_id);
    const apiUrl = process.env.VOICEOVER_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    const backendPayload: Record<string, unknown> = {
      user_id: user.id, // e.g., google-oauth2|123456789
      template_id: template_id || null,
      item_id,
      filters: filters || {}
    };

    if (keywords) backendPayload.keywords = keywords;
    if (urls) backendPayload.urls = urls;
    if (quantity !== undefined) backendPayload.quantity = quantity;

    const res = await fetch(`${apiUrl}/api/v1/media/process-urls`, {
      method: 'POST',
      headers: gatewayHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(backendPayload),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || 'Failed to start media extraction' },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 202 });
  } catch (error) {
    console.error('Media Process API Error:', error);
    return ownershipErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const context = await requireUser();
    const { user } = context;

    const payload = await request.json();
    const { item_id, template_id, urls } = payload;

    if (!item_id || !urls || !Array.isArray(urls)) {
      return NextResponse.json({ error: 'Missing item_id or urls array' }, { status: 400 });
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    const media = await fetchOwnedMedia(context, template_id, item_id);
    const ownedUrls = urls.map((url: unknown) => ownedMediaUrl(media.data, url));
    const backendPayload = { user_id: user.id, urls: ownedUrls };

    const res = await fetch(`${apiUrl}/api/v1/media/`, {
      method: 'DELETE',
      headers: gatewayHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(backendPayload),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || 'Failed to delete media' },
        { status: res.status }
      );
    }

    const data = await res.json().catch(() => ({ success: true }));
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Media Delete API Error:', error);
    return ownershipErrorResponse(error);
  }
}
