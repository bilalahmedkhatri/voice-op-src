"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiRefreshCw, FiAlertCircle, FiVideo } from "react-icons/fi";
import { detectTemplatePlatform } from "@/lib/platformDetector";

export default function ContentRedirectDispatcher() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    if (!id) {
      setError("No Template ID provided. Please select a template from the list.");
      return;
    }

    const checkAndRedirect = async () => {
      try {
        const res = await fetch(`/api/templates?id=${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load template");

        const platform = detectTemplatePlatform(data.template?.json_data);
        if (platform === "youtube") {
          router.replace(`/youtube/content?id=${id}`);
        } else {
          router.replace(`/facebook/content?id=${id}`);
        }
      } catch (err: any) {
        setError(err.message || "Template not found");
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
            className="flex-1 text-center py-2.5 px-4 bg-gradient-to-r from-[#ff9b8f] to-[#ff7d6e] hover:from-[#f8887a] hover:to-[#f05a48] text-white rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            Go to YouTube Strategies
          </Link>
          <Link
            href="/facebook/templates"
            className="flex-1 text-center py-2.5 px-4 bg-white border border-slate-200 hover:bg-orange-50/50 hover:border-orange-200 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-2xs"
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
      <p className="text-sm font-semibold text-slate-700">Opening content workspace...</p>
      <p className="text-xs text-slate-400">Detecting platform strategy...</p>
    </div>
  );
}
