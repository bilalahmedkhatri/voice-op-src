"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FiArrowLeft,
  FiShare2,
  FiCheckCircle,
  FiCalendar,
  FiSend,
  FiClock,
  FiTrash2,
  FiExternalLink,
  FiRefreshCw,
  FiInstagram,
} from "react-icons/fi";
import { FaFacebook, FaInstagram, FaGoogle } from "react-icons/fa";
import FacebookConnect from "@/app/components/FacebookConnect";
import FacebookPostEditor from "@/app/components/FacebookPostEditor";
import IconButton from "@/components/ui/IconButton";
import Button from "@/components/ui/Button";

export default function WorkspaceFacebookIntegrationPage() {
  const [connectedPages, setConnectedPages] = useState<any[]>([]);
  const [isLoadingPages, setIsLoadingPages] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [isUnauthenticated, setIsUnauthenticated] = useState(false);

  // Scheduled & Published Posts
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [postFilter, setPostFilter] = useState<"all" | "scheduled" | "published" | "cancelled">("all");

  // Pre-filled data transferred from Content Studio
  const [prefilledData, setPrefilledData] = useState<any | null>(null);

  // 1. Fetch connected pages from Neon DB on mount
  const fetchPages = async () => {
    setIsLoadingPages(true);
    try {
      const res = await fetch("/api/facebook/pages");
      if (res.status === 401) {
        setIsUnauthenticated(true);
        setConnectedPages([]);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setConnectedPages(data.pages || []);
        setIsUnauthenticated(false);
      }
    } catch (err) {
      console.error("Failed to load connected pages:", err);
    } finally {
      setIsLoadingPages(false);
    }
  };

  // 2. Fetch scheduled/published posts history
  const fetchPosts = async () => {
    setIsLoadingPosts(true);
    try {
      const res = await fetch("/api/facebook/posts");
      if (res.status === 401) {
        setIsUnauthenticated(true);
        setPosts([]);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch (err) {
      console.error("Failed to load posts:", err);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  useEffect(() => {
    fetchPages();
    fetchPosts();

    // Check for prefilled data from Workflow B (e.g. from /facebook/content)
    try {
      const stored = sessionStorage.getItem("fb_composer_prefill");
      if (stored) {
        const parsed = JSON.parse(stored);
        setPrefilledData(parsed);
        // Clear after picking it up
        sessionStorage.removeItem("fb_composer_prefill");
      }
    } catch (e) {
      console.error("Failed to parse prefilled data:", e);
    }
  }, []);

  const handlePagesFetched = (pages: any[]) => {
    setConnectedPages(pages);
    fetchPosts();
  };

  const handleDisconnect = async () => {
    if (connectedPages.length > 0) {
      const active = connectedPages[0];
      try {
        await fetch(`/api/facebook/pages?page_id=${active.page_id || active.id}`, {
          method: "DELETE",
        });
      } catch (e) {
        console.error("Failed to disconnect page:", e);
      }
    }
    setConnectedPages([]);
  };

  const handleCancelPost = async (postId: string) => {
    if (!confirm("Are you sure you want to cancel this scheduled post?")) return;
    try {
      const res = await fetch(`/api/facebook/posts/${postId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchPosts();
      }
    } catch (err) {
      console.error("Error cancelling post:", err);
    }
  };

  const filteredPosts = posts.filter((p) => {
    if (postFilter === "all") return true;
    return p.status === postFilter;
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/facebook/templates"
              className="inline-flex items-center gap-1.5 text-xs text-[#c83a2a] hover:underline font-semibold mb-1"
            >
              <FiArrowLeft /> Back to Facebook Plans
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-orange-50 text-[#ff7d6e] text-sm font-black">
              f
            </span>
            Facebook & Instagram Studio
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Connect your Facebook Pages, publish Reels or Shorts directly from your plans, or schedule them up to 75 days in advance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/facebook/templates"
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-orange-50/50 hover:border-[#ff9b8f]/60 text-slate-700 rounded-xl text-sm font-semibold shadow-2xs transition-all cursor-pointer"
          >
            View Facebook Plans
          </Link>
        </div>
      </div>

      {/* Prefill Notification Banner */}
      {prefilledData && (
        <div className="p-4 bg-orange-50/80 border border-orange-200/80 rounded-2xl flex items-center justify-between text-xs text-orange-950 shadow-xs">
          <div className="flex items-center gap-2">
            <FiCheckCircle className="text-[#ff7d6e] text-base" />
            <span>
              Pre-filled asset loaded from Content Studio:{" "}
              <strong>{prefilledData.title || "Selected Item"}</strong>
            </span>
          </div>
          <button
            onClick={() => setPrefilledData(null)}
            className="text-xs font-bold text-[#c83a2a] hover:underline cursor-pointer"
          >
            Clear
          </button>
        </div>
      )}

      {/* Main Composer Section */}
      <div>
        {isUnauthenticated ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-8 sm:p-10 text-center max-w-lg mx-auto shadow-xs space-y-4">
            <div className="w-12 h-12 rounded-xl bg-orange-50 text-[#ff7d6e] flex items-center justify-center mx-auto text-xl">
              <FaFacebook />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Sign In to Connect Facebook & Instagram</h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
              Sign in with Google to securely store page access tokens, schedule posts up to 75 days ahead, and manage published Reels.
            </p>
            <div className="pt-2 flex justify-center">
              <Button
                href="/api/auth/google?returnTo=/facebook/integration"
                variant="primary"
                size="lg"
                className="shadow-xs hover:shadow"
                icon={<FaGoogle className="w-3.5 h-3.5" />}
              >
                Sign in with Google
              </Button>
            </div>
          </div>
        ) : isLoadingPages ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-12 flex flex-col items-center justify-center text-slate-400 gap-2 shadow-xs">
            <FiRefreshCw className="animate-spin text-2xl text-[#ff7d6e]" />
            <span className="text-xs font-medium">Checking connected accounts...</span>
          </div>
        ) : connectedPages.length === 0 || isReconnecting ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs max-w-xl mx-auto">
            {connectedPages.length > 0 && (
              <div className="flex items-center justify-between mb-4 px-2">
                <span className="text-xs font-bold text-slate-700">Sync & Re-Select Pages</span>
                <button
                  type="button"
                  onClick={() => setIsReconnecting(false)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                >
                  ← Back to Post Studio
                </button>
              </div>
            )}
            <FacebookConnect
              onPagesFetched={(pages) => {
                handlePagesFetched(pages);
                setIsReconnecting(false);
              }}
            />
          </div>
        ) : (
          <FacebookPostEditor
            pages={connectedPages}
            onDisconnect={handleDisconnect}
            onResyncPages={() => setIsReconnecting(true)}
            onPostCreated={fetchPosts}
            initialData={prefilledData}
          />
        )}
      </div>

      {/* Scheduled & Published History Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FiClock className="text-[#ff7d6e]" /> Scheduled & Published Posts
            </h3>
            <p className="text-[11px] text-slate-500">
              Manage your queue, view published post IDs, or cancel scheduled releases.
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl">
            {(["all", "scheduled", "published", "cancelled"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setPostFilter(filter)}
                className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${postFilter === filter
                  ? "bg-[#ff7d6e] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                {filter}
              </button>
            ))}
            <IconButton
              title="Refresh Queue"
              size="xs"
              variant="ghost"
              isLoading={isLoadingPosts}
              onClick={fetchPosts}
              className="ml-1"
            />
          </div>
        </div>

        {filteredPosts.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs">
            No {postFilter !== "all" ? postFilter : ""} posts found in queue.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Target</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Caption</th>
                  <th className="py-2.5 px-3">Timing</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPosts.map((p) => {
                  const isScheduled = p.status === "scheduled";
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          {p.destination === "instagram" ? (
                            <FaInstagram className="text-pink-600 text-sm" />
                          ) : (
                            <FaFacebook className="text-blue-600 text-sm" />
                          )}
                          <span>{p.page_name || "Page"}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                          {p.post_type}
                        </span>
                      </td>
                      <td className="py-3 px-3 max-w-[280px]">
                        <p className="truncate text-slate-700 font-medium">{p.message}</p>
                      </td>
                      <td className="py-3 px-3 text-slate-500 text-[11px] whitespace-nowrap">
                        {p.scheduled_publish_time
                          ? new Date(p.scheduled_publish_time).toLocaleString()
                          : new Date(p.created_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${p.status === "scheduled"
                            ? "bg-amber-50 text-amber-800 border border-amber-200/80"
                            : p.status === "published"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                              : "bg-slate-100 text-slate-500 border border-slate-200"
                            }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {p.fb_post_id && (
                            <a
                              href={`https://facebook.com/${p.fb_post_id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-slate-400 hover:text-[#c83a2a] transition-colors"
                              title="View on Meta"
                            >
                              <FiExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {isScheduled && (
                            <button
                              onClick={() => handleCancelPost(p.id)}
                              className="text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                              title="Cancel Scheduled Post"
                            >
                              <FiTrash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
