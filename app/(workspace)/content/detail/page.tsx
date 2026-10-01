"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiRefreshCw, FiAlertCircle } from "react-icons/fi";
import { detectTemplatePlatform } from "@/lib/platformDetector";

export default function ContentDetailRedirectDispatcher() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const templateId = params.get("templateId");
    const itemId = params.get("itemId");

    if (!templateId || !itemId) {
      setError("Missing templateId or itemId parameters.");
      return;
    }

    const checkAndRedirect = async () => {
      try {
        const res = await fetch(`/api/templates?id=${templateId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load template");

        const platform = detectTemplatePlatform(data.template?.json_data);
        if (platform === "youtube") {
          router.replace(`/youtube/content/detail?templateId=${templateId}&itemId=${itemId}`);
        } else {
          router.replace(`/facebook/content/detail?templateId=${templateId}&itemId=${itemId}`);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load detail");
      }
    };

    checkAndRedirect();
  }, [router]);

  if (error) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 space-y-4">
        <div className="flex items-center gap-3 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200">
          <FiAlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
        <div className="flex items-center gap-3 pt-2">
          <Link
            href="/youtube/templates"
            className="flex-1 text-center py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors"
          >
            Go to YouTube Strategies
          </Link>
          <Link
            href="/facebook/templates"
            className="flex-1 text-center py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors"
          >
            Go to Facebook Plans
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-80 space-y-3">
      <FiRefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
      <p className="text-sm font-semibold text-slate-700">Opening item details...</p>
      <p className="text-xs text-slate-400">Redirecting to platform workspace...</p>
    </div>
  );
}
