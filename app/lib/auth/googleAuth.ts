import { cookies } from 'next/headers';
import { getDb } from '../db';
import { DbUser } from '../db/types';

const SESSION_COOKIE_NAME = 'vg_session_token';
const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

export function getGoogleOAuthURL(state?: string): string {
  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/callback/google';

  const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  const options = {
    redirect_uri: redirectUri,
    client_id: clientId,
    access_type: 'offline',
    response_type: 'code',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
      'openid',
    ].join(' '),
    state: state || '/',
  };

  const qs = new URLSearchParams(options);
  return `${rootUrl}?${qs.toString()}`;
}

export async function exchangeGoogleCodeForTokens(code: string): Promise<{
  access_token: string;
  id_token: string;
} | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/callback/google';

  const url = 'https://oauth2.googleapis.com/token';
  const values = {
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(values).toString(),
    });

    if (!res.ok) {
      console.error('Failed to exchange code for tokens:', await res.text());
      return null;
    }

    return await res.json();
  } catch (error) {
    console.error('Error in exchangeGoogleCodeForTokens:', error);
    return null;
  }
}

export async function getGoogleUserProfile(accessToken: string): Promise<{
  sub: string;
  name: string;
  email: string;
  picture: string;
} | null> {
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error('Error fetching Google user profile:', error);
    return null;
  }
}

export async function createOrUpdateUserAndSession(googleUser: {
  sub: string;
  name: string;
  email: string;
  picture: string;
}): Promise<string | null> {
  const sql = getDb();
  if (!sql) return null;

  try {
    const userId = `usr_${crypto.randomUUID().replace(/-/g, '')}`;
    const sessionToken = `ses_${crypto.randomUUID().replace(/-/g, '')}`;
    const sessionId = `sid_${crypto.randomUUID().replace(/-/g, '')}`;
    const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000).toISOString();

    // 1. Upsert User by google_id
    const userResult = await sql`
      INSERT INTO users (id, email, name, image, google_id, created_at, updated_at)
      VALUES (${userId}, ${googleUser.email}, ${googleUser.name}, ${googleUser.picture}, ${googleUser.sub}, NOW(), NOW())
      ON CONFLICT (google_id) DO UPDATE 
      SET email = ${googleUser.email}, name = ${googleUser.name}, image = ${googleUser.picture}, updated_at = NOW()
      RETURNING id, email, name, image, google_id
    `;

    const activeUserId = userResult[0].id;

    // 2. Initialize user quota if not exists
    const resetDate = new Date();
    resetDate.setUTCHours(24, 0, 0, 0); // Next UTC midnight

    await sql`
      INSERT INTO user_quotas (user_id, generations_used, max_daily_generations, max_chars_per_request, chars_used_today, max_daily_chars, reset_at, updated_at)
      VALUES (${activeUserId}, 0, 5, 2500, 0, 12500, ${resetDate.toISOString()}, NOW())
      ON CONFLICT (user_id) DO NOTHING
    `;

    // 3. Insert Session
    await sql`
      INSERT INTO sessions (id, user_id, session_token, expires, created_at)
      VALUES (${sessionId}, ${activeUserId}, ${sessionToken}, ${expiresAt}, NOW())
    `;

    return sessionToken;
  } catch (error) {
    console.error('Error creating user session in DB:', error);
    return null;
  }
}

export async function getCurrentUser(): Promise<DbUser | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) return null;

  const sql = getDb();
  if (!sql) return null;

  try {
    const result = await sql`
      SELECT u.id, u.email, u.name, u.image, u.google_id, u.created_at, u.updated_at
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.session_token = ${sessionToken}
        AND s.expires > NOW()
      LIMIT 1
    `;

    if (!result || result.length === 0) return null;
    return result[0] as DbUser;
  } catch (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
}

export async function invalidateSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) return true;

  const sql = getDb();
  if (sql) {
    try {
      await sql`DELETE FROM sessions WHERE session_token = ${sessionToken}`;
    } catch (e) {
      console.error('Error deleting session:', e);
    }
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
  return true;
}

export { SESSION_COOKIE_NAME, SESSION_MAX_AGE };
