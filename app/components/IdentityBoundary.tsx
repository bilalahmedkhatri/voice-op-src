'use client';

import { useEffect, useRef, useState } from 'react';
import { resolveOwnerScope, setOwnerScope } from '../lib/ownerStorage';
import WorkspaceLoading from './WorkspaceLoading';

export default function IdentityBoundary({ children }: { children: React.ReactNode }) {
  const [scope, setScope] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const current = useRef<string | null>(null);
  useEffect(() => {
    let disposed = false;
    let checking = false;
    const check = async () => {
      if (checking) return;
      checking = true;
      try {
        const next = await resolveOwnerScope();
        if (disposed) return;
        // A full reload also clears sidebar state and requests from the previous identity.
        if (current.current && current.current !== next) {
          setScope(null);
          window.location.reload();
          return;
        }
        current.current = next;
        setOwnerScope(next);
        setScope(next);
        setFailed(false);
      } catch {
        if (!disposed) { setScope(null); setFailed(true); }
      } finally { checking = false; }
    };
    void check();
    const channel = new BroadcastChannel('genzee-identity');
    channel.onmessage = () => { setScope(null); void check(); };
    const recheck = () => { void check(); };
    const identityChanged = () => { setScope(null); void check(); };
    window.addEventListener('focus', recheck);
    window.addEventListener('identity-changed', identityChanged);
    const timer = window.setInterval(check, 15000);
    return () => {
      disposed = true; channel.close(); window.clearInterval(timer);
      window.removeEventListener('focus', recheck);
      window.removeEventListener('identity-changed', identityChanged);
    };
  }, []);
  if (!scope) {
    if (failed) return <div role="alert" className="p-8 text-sm text-slate-600">Unable to verify your account. Please refresh to try again.</div>;
    return <WorkspaceLoading fullScreen />;
  }
  return <div key={scope} className="contents">{children}</div>;
}
