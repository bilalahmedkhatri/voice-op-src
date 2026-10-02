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
  const stateRaw = searchParams.get('state');
  const storedNonce = request.cookies.get('vg_oauth_nonce')?.value;

  const baseUrl = new URL(request.url).origin;

  // Validate state and extract returnTo with CSRF nonce verification
  let returnTo = '/admin';
  if (stateRaw) {
    try {
      const parsed = JSON.parse(Buffer.from(stateRaw, 'base64url').toString('utf-8'));
      if (parsed.returnTo && typeof parsed.returnTo === 'string' && parsed.returnTo.startsWith('/')) {
        returnTo = parsed.returnTo;
      }
      // CSRF check: if nonce was set, ensure it matches
      if (storedNonce && parsed.nonce && parsed.nonce !== storedNonce) {
        console.warn('OAuth state CSRF mismatch detected');
        return NextResponse.redirect(`${baseUrl}/admin?error=csrf_state_mismatch`);
      }
    } catch {
      // Legacy fallback
      if (stateRaw.startsWith('/')) {
        returnTo = stateRaw;
      }
    }
  }

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/admin?error=no_code`);
  }

  try {
    const tokens = await exchangeGoogleCodeForTokens(code);
    if (!tokens || !tokens.access_token) {
      return NextResponse.redirect(`${baseUrl}/admin?error=auth_failed`);
    }

    const profile = await getGoogleUserProfile(tokens.access_token);
    if (!profile || !profile.sub || !profile.email) {
      return NextResponse.redirect(`${baseUrl}/admin?error=profile_failed`);
    }

    const sessionToken = await createOrUpdateUserAndSession(profile);
    if (!sessionToken) {
      return NextResponse.redirect(`${baseUrl}/admin?error=session_creation_failed`);
    }

    const response = NextResponse.redirect(`${baseUrl}${returnTo}`);

    // Set session cookie
    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE,
    });

    // Clear one-time OAuth nonce cookie
    response.cookies.delete('vg_oauth_nonce');

    return response;
  } catch (error) {
    console.error('Google callback error:', error);
    return NextResponse.redirect(`${baseUrl}/admin?error=oauth_error`);
  }
}
