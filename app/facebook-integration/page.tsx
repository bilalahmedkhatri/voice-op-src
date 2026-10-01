'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FacebookIntegrationRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/facebook/integration');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center space-y-2">
        <div className="w-8 h-8 border-2 border-[#ff7d6e] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-semibold">Redirecting to Facebook & Instagram Studio...</p>
      </div>
    </div>
  );
}
