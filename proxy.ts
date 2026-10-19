import { NextRequest, NextResponse } from 'next/server';
import { isSameOriginMutation } from './app/lib/requestSecurity';
import { getCurrentUser } from './app/lib/auth/googleAuth';
import { getGuestOwner } from './app/lib/auth/guestOwner';
import { createHash } from 'node:crypto';
import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';

const localeMiddleware = createMiddleware(routing);

export async function proxy(request: NextRequest) {
  if (!/^\/api(?:\/|$)/.test(request.nextUrl.pathname)) return localeMiddleware(request);
  // Disabled payment callbacks cannot mutate balances; future callbacks need provider verification.
  if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method) && request.nextUrl.pathname !== '/api/billing/webhook' && !isSameOriginMutation(request)) {
    return NextResponse.json({ error: 'Request origin is not allowed.' }, { status: 403 });
  }
  const expected = request.headers.get('X-Owner-Scope');
  if (expected && !request.nextUrl.pathname.startsWith('/api/auth/')) {
    try {
      const user = await getCurrentUser();
      const identity = user?.id || await getGuestOwner();
      const scope = createHash('sha256').update(identity).digest('hex');
      if (expected !== scope) {
        return NextResponse.json({ error: 'Account identity changed.' }, {
          status: 409, headers: { 'X-Identity-Changed': 'true', 'Cache-Control': 'private, no-store' },
        });
      }
    } catch {
      return NextResponse.json({ error: 'Unable to verify account identity.' }, { status: 401 });
    }
  }
  const response = NextResponse.next();
  const path = request.nextUrl.pathname;
  if (!/^\/api\/(blog|count|voiceover\/(models|voices|sample))($|\/)/.test(path)) {
    response.headers.set('Cache-Control', 'private, no-store');
  }
  return response;
}

export const config = {matcher: ['/api/:path*', '/((?!api|_next|_vercel|.*\\..*).*)']};
