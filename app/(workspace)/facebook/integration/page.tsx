"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FiArrowLeft, FiShare2, FiCheckCircle, FiCalendar, FiSend } from "react-icons/fi";
import FacebookConnect from "@/app/components/FacebookConnect";
import FacebookPostEditor from "@/app/components/FacebookPostEditor";

export default function WorkspaceFacebookIntegrationPage() {
  const [connectedPages, setConnectedPages] = useState<any[]>([]);

  const handlePagesFetched = (pages: any[]) => {
    setConnectedPages(pages);
  };

  const handleDisconnect = () => {
    setConnectedPages([]);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/facebook/templates"
              className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline font-medium mb-1"
            >
              <FiArrowLeft /> Back to Facebook Plans
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-black">
              f
            </span>
            Facebook Page Integration
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Connect your Facebook Pages, publish posts directly from your plans, or schedule them in advance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/facebook/templates"
            className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-semibold shadow-2xs transition-colors"
          >
            View Facebook Plans
          </Link>
        </div>
      </div>

      {/* Feature Highlights Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 bg-blue-50/60 border border-blue-100 rounded-xl flex items-center gap-3 text-blue-900">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
            <FiSend className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold">Direct Publishing</div>
            <div className="text-[11px] text-blue-700">Publish immediately to connected pages</div>
          </div>
        </div>

        <div className="p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-xl flex items-center gap-3 text-indigo-900">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
            <FiCalendar className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold">Post Scheduling</div>
            <div className="text-[11px] text-indigo-700">Set future publish dates and times</div>
          </div>
        </div>

        <div className="p-3.5 bg-emerald-50/60 border border-emerald-100 rounded-xl flex items-center gap-3 text-emerald-900">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <FiCheckCircle className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold">Multi-Page Access</div>
            <div className="text-[11px] text-emerald-700">Easily switch between brand pages</div>
          </div>
        </div>
      </div>

      {/* Main Integration Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-8 shadow-xs">
        {connectedPages.length === 0 ? (
          <div className="max-w-xl mx-auto py-6">
            <div className="text-center mb-6">
              <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-2xl font-black">
                f
              </div>
              <h2 className="text-lg font-bold text-slate-900">Connect Your Facebook Page</h2>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Log in with Facebook to grant permissions to publish and schedule updates directly to your pages.
              </p>
            </div>
            <FacebookConnect onPagesFetched={handlePagesFetched} />
          </div>
        ) : (
          <div>
            <FacebookPostEditor
              pages={connectedPages}
              onDisconnect={handleDisconnect}
            />
          </div>
        )}
      </div>
    </div>
  );
}
