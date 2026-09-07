'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/**
 * Returns true only on the client after hydration.
 * Uses useSyncExternalStore to avoid the cascading-render
 * anti-pattern of setState inside useEffect.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,   // client snapshot
    () => false,  // server snapshot
  );
}
