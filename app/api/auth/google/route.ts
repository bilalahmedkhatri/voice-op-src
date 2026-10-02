import { NextRequest, NextResponse } from 'next/server';
import { getGoogleOAuthURL } from '@/app/lib/auth/googleAuth';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const returnTo = searchParams.get('returnTo') || '/admin';

  // Generate cryptographically secure random nonce for CSRF protection
  const nonce = crypto.randomBytes(16).toString('hex');
  const statePayload = Buffer.from(JSON.stringify({ nonce, returnTo })).toString('base64url');

  const googleAuthUrl = getGoogleOAuthURL(statePayload);
  const response = NextResponse.redirect(googleAuthUrl);

  // Set short-lived HTTP-only cookie containing nonce
  response.cookies.set('vg_oauth_nonce', nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 10 * 60, // 10 minutes
  });

  return response;
}
