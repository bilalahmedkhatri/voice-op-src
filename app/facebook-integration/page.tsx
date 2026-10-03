'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function FacebookIntegrationRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/facebook/integration');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="text-center space-y-3 max-w-md">
        <div className="w-8 h-8 border-2 border-[#ff7d6e] border-t-transparent rounded-full animate-spin mx-auto" />
        <h1 className="text-xl font-bold text-slate-900">
          Redirecting to Facebook &amp; Instagram Integration
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          If you are not redirected automatically, please click below to enter the studio:
        </p>
        <div>
          <Link
            href="/facebook/integration"
            className="inline-block text-xs font-semibold text-[#c83a2a] hover:underline"
          >
            Go to Facebook Studio &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
