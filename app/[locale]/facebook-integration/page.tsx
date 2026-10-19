'use client';

import {useCopy} from '@/i18n/copy';

import { useEffect } from 'react';
import {useRouter} from '@/i18n/navigation';
import {Link} from '@/i18n/navigation';

export default function FacebookIntegrationRedirect() {
  const copy = useCopy();


  const router = useRouter();

  useEffect(() => {
    router.replace('/facebook/integration');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="text-center space-y-3 max-w-md">
        <h1 className="text-xl font-bold text-slate-900">
          {copy("Redirecting to Facebook & Instagram Integration")}</h1>
        <p className="text-xs text-slate-500 font-medium">
          {copy("If you are not redirected automatically, please click below to enter the studio:")}</p>
        <div>
          <Link
            href="/facebook/integration"
            className="inline-block text-xs font-semibold text-[#c83a2a] hover:underline"
          >
            {copy("Go to Facebook Studio →")}</Link>
        </div>
      </div>
    </div>
  );
}
