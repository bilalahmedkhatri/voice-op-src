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
        <div className="flex items-center gap-3 p-4 bg-rose-50 text-rose-700 rounded-2xl border border-rose-200/80 shadow-xs">
          <FiAlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
        <div className="flex items-center gap-3 pt-2">
          <Link
            href="/youtube/templates"
            className="flex-1 text-center py-2.5 px-4 bg-gradient-to-r from-[#ff9b8f] to-[#ff7d6e] hover:from-[#f8887a] hover:to-[#f05a48] text-white rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            Go to YouTube Strategies
          </Link>
          <Link
            href="/facebook/templates"
            className="flex-1 text-center py-2.5 px-4 bg-white hover:bg-orange-50/50 text-slate-700 border border-slate-200 hover:border-[#ff9b8f]/60 rounded-xl text-xs font-bold transition-all shadow-2xs"
          >
            Go to Facebook Plans
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-80 space-y-3">
      <FiRefreshCw className="w-8 h-8 text-[#ff7d6e] animate-spin" />
      <p className="text-sm font-semibold text-slate-700">Opening item details...</p>
      <p className="text-xs text-slate-400">Redirecting to platform workspace...</p>
    </div>
  );
}
