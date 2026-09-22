import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/lib/auth/googleAuth';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await request.json();
    const { item_id, keywords, urls, filters, quantity } = payload;

    if (!item_id) {
      return NextResponse.json({ error: 'Missing item_id' }, { status: 400 });
    }

    if (!urls && (!keywords || !Array.isArray(keywords))) {
      return NextResponse.json({ error: 'Missing urls or invalid keywords' }, { status: 400 });
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    const backendPayload: any = {
      user_id: user.id, // e.g., google-oauth2|123456789
      item_id,
      filters: filters || {}
    };

    if (keywords) backendPayload.keywords = keywords;
    if (urls) backendPayload.urls = urls;
    if (quantity !== undefined) backendPayload.quantity = quantity;

    const res = await fetch(`${apiUrl}/api/v1/media/process-urls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
  } catch (error: any) {
    console.error('Media Process API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await request.json();
    const { item_id, urls } = payload;

    if (!item_id || !urls || !Array.isArray(urls)) {
      return NextResponse.json({ error: 'Missing item_id or urls array' }, { status: 400 });
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    const backendPayload = {
      user_id: user.id,
      urls
    };

    const res = await fetch(`${apiUrl}/api/v1/media/`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
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
  } catch (error: any) {
    console.error('Media Delete API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
