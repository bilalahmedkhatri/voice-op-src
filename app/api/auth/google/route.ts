import { NextRequest, NextResponse } from 'next/server';
import { getGoogleOAuthURL } from '@/app/lib/auth/googleAuth';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const returnTo = searchParams.get('returnTo') || '/';

  const googleAuthUrl = getGoogleOAuthURL(returnTo);
  return NextResponse.redirect(googleAuthUrl);
}
