'use client';

let activeScope: string | null = null;
let resolving: Promise<string> | null = null;
export function knownOwnerScope(): string | null { return activeScope; }
export function setOwnerScope(scope: string) { activeScope = scope; }
export function currentOwnerScope(): string {
  if (!activeScope) throw new Error('Account identity is still loading.');
  return activeScope;
}
export async function resolveOwnerScope(): Promise<string> {
  if (!resolving) {
    resolving = (async () => {
      const response = await fetch('/api/auth/session', { cache: 'no-store' });
      if (!response.ok) throw new Error('Unable to verify account identity.');
      const data = await response.json();
      if (typeof data.owner_scope !== 'string') throw new Error('Missing account identity.');
      return data.owner_scope as string;
    })().finally(() => { resolving = null; });
  }
  return resolving;
}
export function ownerDraftKey(key: string) { return `genzee:${currentOwnerScope()}:${key}`; }
// Bind requests to the identity whose screen initiated them. This prevents a stale tab
// from mutating the account that signed in from another tab.
export async function ownerFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = new URL(input instanceof Request ? input.url : String(input), window.location.origin);
  const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
  if (activeScope && url.origin === window.location.origin && url.pathname.startsWith('/api/') && !url.pathname.startsWith('/api/auth/') && !/^\/api\/(blog|count|voiceover\/(models|voices|sample))($|\/)/.test(url.pathname)) {
    headers.set('X-Owner-Scope', activeScope);
  }
  const response = await window.fetch(input, { ...init, headers });
  if (response.status === 409 && response.headers.get('X-Identity-Changed') === 'true') {
    notifyIdentityChanged();
    throw new Error('Your account changed. Refreshing the workspace.');
  }
  return response;
}
export const ownerDrafts = {
  getItem: (key: string) => sessionStorage.getItem(ownerDraftKey(key)),
  setItem: (key: string, value: string) => sessionStorage.setItem(ownerDraftKey(key), value),
  removeItem: (key: string) => sessionStorage.removeItem(ownerDraftKey(key)),
};
export function notifyIdentityChanged() {
  const channel = new BroadcastChannel('genzee-identity');
  channel.postMessage('changed');
  channel.close();
  window.dispatchEvent(new Event('identity-changed'));
}
