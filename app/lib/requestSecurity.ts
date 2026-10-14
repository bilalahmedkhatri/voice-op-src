export function isSameOriginMutation(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return request.headers.get('sec-fetch-site') === 'same-origin';
  try { return new URL(origin).origin === new URL(request.url).origin; } catch { return false; }
}
