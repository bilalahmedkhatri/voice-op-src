import { NextRequest, NextResponse } from 'next/server';
import {
  exchangeGoogleCodeForTokens,
  getGoogleUserProfile,
  createOrUpdateUserAndSession,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE,
} from '@/app/lib/auth/googleAuth';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state') || '/';

  const baseUrl = new URL(request.url).origin;

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/?error=no_code`);
  }

  try {
    const tokens = await exchangeGoogleCodeForTokens(code);
    if (!tokens || !tokens.access_token) {
      return NextResponse.redirect(`${baseUrl}/?error=auth_failed`);
    }

    const profile = await getGoogleUserProfile(tokens.access_token);
    if (!profile || !profile.sub || !profile.email) {
      return NextResponse.redirect(`${baseUrl}/?error=profile_failed`);
    }

    const sessionToken = await createOrUpdateUserAndSession(profile);
    if (!sessionToken) {
      return NextResponse.redirect(`${baseUrl}/?error=session_creation_failed`);
    }

    const response = NextResponse.redirect(`${baseUrl}${state.startsWith('/') ? state : '/'}`);

    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE,
    });

    return response;
  } catch (error) {
    console.error('Google callback error:', error);
    return NextResponse.redirect(`${baseUrl}/?error=oauth_error`);
  }
}
