import { OwnershipError, requireOwnedTemplateItem, type OwnerContext } from './auth/ownership';
import { gatewayHeaders } from './gatewayHeaders';

export async function fetchOwnedMedia(context: OwnerContext, templateId: string, itemId: string) {
  await requireOwnedTemplateItem(context, templateId, itemId);
  const query = new URLSearchParams({ user_id: context.user.id, template_id: templateId });
  const base = process.env.VOICEOVER_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const response = await fetch(`${base}/api/v1/media/${encodeURIComponent(itemId)}?${query}`, {
    cache: 'no-store', signal: AbortSignal.timeout(30000),
    headers: gatewayHeaders(),
  });
  if (!response.ok) throw new OwnershipError('Unable to retrieve your media.', 502);
  const data = await response.json();
  if (!Array.isArray(data.data) || !data.data.every((url: unknown) => typeof url === 'string')) {
    throw new OwnershipError('Invalid media response.', 502);
  }
  return data as { status: string; data: string[] };
}

export function ownedMediaUrl(urls: string[], supplied: unknown): string {
  if (typeof supplied !== 'string') throw new OwnershipError('Media URL is required.', 400);
  let target: URL;
  try { target = new URL(supplied); } catch { throw new OwnershipError('Invalid media URL.', 400); }
  const match = urls.find(url => {
    const trusted = new URL(url);
    return trusted.origin === target.origin && trusted.pathname === target.pathname;
  });
  if (!match) throw new OwnershipError('Media not found.', 404);
  return match; // Use fresh server-provided signature, never caller-controlled query parameters.
}
