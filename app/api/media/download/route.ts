import { NextRequest, NextResponse } from 'next/server';
import { requireUser, requireId, ownershipErrorResponse } from '@/app/lib/auth/ownership';
import { fetchOwnedMedia, ownedMediaUrl } from '@/app/lib/ownedMedia';
import { fetchPrivateFile } from '@/app/lib/privateDownload';

export async function GET(request: NextRequest) {
  try {
    const context = await requireUser();
    const params = request.nextUrl.searchParams;
    const templateId = requireId(params.get('templateId'), 'Template ID');
    const itemId = requireId(params.get('itemId'), 'Content item ID');
    const media = await fetchOwnedMedia(context, templateId, itemId);
    const response = await fetchPrivateFile(ownedMediaUrl(media.data, params.get('url')));
    return new NextResponse(response.body, { headers: {
      'Content-Type': response.headers.get('content-type') || 'application/octet-stream',
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    } });
  } catch (error) { return ownershipErrorResponse(error); }
}
