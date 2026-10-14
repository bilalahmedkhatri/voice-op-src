import { OwnershipError } from './auth/ownership';

export async function fetchPrivateFile(url: string, headers?: HeadersInit) {
  const parsed = new URL(url);
  const configured = (process.env.MEDIA_DOWNLOAD_HOSTS || '').split(',').map(host => host.trim()).filter(Boolean);
  const allowed = parsed.hostname.endsWith('.backblazeb2.com') || configured.includes(parsed.hostname);
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password || !allowed) {
    throw new OwnershipError('This storage host is not configured for downloads.', 403);
  }
  const response = await fetch(parsed, { headers, redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(60000) });
  if (!response.ok) throw new OwnershipError('Unable to download this file.', 502);
  return response;
}
