import { NextRequest, NextResponse } from 'next/server';
import { requireUser, requireId, ownershipErrorResponse } from '@/app/lib/auth/ownership';
import { fetchOwnedMedia } from '@/app/lib/ownedMedia';
export async function GET(request: NextRequest) {
  try {
    const context = await requireUser();
    const query = request.nextUrl.searchParams;
    return NextResponse.json(await fetchOwnedMedia(context,
      requireId(query.get('templateId'), 'Template ID'), requireId(query.get('itemId'), 'Content item ID')));
  } catch (error) { return ownershipErrorResponse(error); }
}
