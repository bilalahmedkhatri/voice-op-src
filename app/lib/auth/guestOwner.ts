import { cookies } from 'next/headers';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { OwnershipError } from './ownership';

const COOKIE_NAME = 'vg_guest_owner';
const DEV_SECRET = randomBytes(32).toString('hex');

function secret() {
  const key = process.env.OWNERSHIP_TOKEN_SECRET || process.env.GOOGLE_CLIENT_SECRET;
  if (key) return key;
  if (process.env.NODE_ENV === 'production') throw new OwnershipError('Guest generation is unavailable.', 503);
  return DEV_SECRET;
}

export async function getGuestOwner(create = false): Promise<string> {
  const store = await cookies();
  let id = store.get(COOKIE_NAME)?.value;
  if (!id || !/^[a-f0-9]{64}$/.test(id)) {
    if (!create) throw new OwnershipError('Audio job not found.', 404);
    id = randomBytes(32).toString('hex');
  }
  if (create) store.set(COOKIE_NAME, id, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 365 * 86400 });
  return id;
}

export function issueGuestJobToken(owner: string, jobId: string): string {
  const payload = Buffer.from(JSON.stringify({ owner, jobId, expires: Date.now() + 7 * 86400000 })).toString('base64url');
  return `${payload}.${createHmac('sha256', secret()).update(payload).digest('base64url')}`;
}

export function verifyGuestJobToken(token: string | null, owner: string, jobId: string): void {
  try {
    const [payload, signature, extra] = (token || '').split('.');
    if (!payload || !signature || extra) throw new Error();
    const expected = createHmac('sha256', secret()).update(payload).digest();
    const supplied = Buffer.from(signature, 'base64url');
    if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) throw new Error();
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (data.owner !== owner || data.jobId !== jobId || !Number.isFinite(data.expires) || data.expires <= Date.now()) throw new Error();
  } catch {
    throw new OwnershipError('Audio job not found.', 404);
  }
}
