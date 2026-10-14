/** Server routes only: identifies this app, never a frontend end user. */
export function gatewayHeaders(initial: Record<string, string> = {}): Record<string, string> {
  const key = process.env.GATEWAY_API_KEY?.trim();
  const configured = process.env.GATEWAY_APP_ORIGIN?.trim();
  if (!key || !configured) throw new Error('Gateway app credentials are not configured.');
  const url = new URL(configured);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password ||
      url.hostname.includes('*') || !['', '/'].includes(url.pathname) || url.search || url.hash) {
    throw new Error('GATEWAY_APP_ORIGIN must be an exact HTTP(S) origin.');
  }
  return { ...initial, 'X-API-Key': key, 'X-App-Origin': url.origin };
}
