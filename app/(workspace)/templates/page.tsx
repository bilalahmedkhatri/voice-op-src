"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { FiTrash2, FiDatabase, FiRefreshCw, FiAlertCircle, FiVideo } from "react-icons/fi";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { detectTemplatePlatform, getContentUrl } from "@/lib/platformDetector";

type Template = {
  id: string;
  json_data: any;
  status: string;
  confirmed_by_email: string | null;
  view_count: number;
  updated_by: string;
  created_at: string;
  updated_at: string;
};

const extractTemplateInfo = (jsonData: any) => {
  if (!jsonData || typeof jsonData !== 'object') {
    return { title: "Unknown Template", channel: "Unknown Channel", contentInfo: "No data", statuses: [] };
  }

  let title = "Unknown Topic";
  if (jsonData?.content_strategy?.long_video?.title) {
    title = jsonData.content_strategy.long_video.title;
  } else if (Array.isArray(jsonData?.content_plan) && jsonData.content_plan.length > 0) {
    const firstPlan = jsonData.content_plan[0];
    title = firstPlan.theme || (jsonData.page_name ? `${jsonData.page_name} Content Plan` : "Content Plan");
  } else if (Array.isArray(jsonData?.captions) && jsonData.captions.length > 0) {
    title = jsonData.title || (jsonData.page_name ? `${jsonData.page_name} Captions` : `${jsonData.captions.length} Social Media Captions`);
  } else {
    const searchTitle = (obj: any): string | null => {
      if (!obj || typeof obj !== 'object') return null;
      if (typeof obj.title === 'string') return obj.title;
      if (typeof obj.topic === 'string') return obj.topic;
      if (typeof obj.theme === 'string') return obj.theme;
      if (typeof obj.project_name === 'string') return obj.project_name;
      for (const key in obj) {
        if (typeof obj[key] === 'object') {
          const found = searchTitle(obj[key]);
          if (found) return found;
        }
      }
      return null;
    };
    const foundTitle = searchTitle(jsonData);
    if (foundTitle) title = foundTitle;
  }

  let channel = "Unknown Channel";
  if (jsonData?.page_name && typeof jsonData.page_name === 'string') {
    channel = jsonData.page_name;
  } else if (jsonData?.channel_info?.channel_name) {
    channel = jsonData.channel_info.channel_name;
  } else if (typeof jsonData?.channel === 'string') {
    channel = jsonData.channel;
  }

  let contentParts = [];
  let statuses: string[] = [];

  if (jsonData?.content_strategy?.shorts && Array.isArray(jsonData.content_strategy.shorts)) {
    contentParts.push(`${jsonData.content_strategy.shorts.length} Shorts`);
    jsonData.content_strategy.shorts.forEach((short: any) => {
      statuses.push(short.status || "pending");
    });
  }
  if (jsonData?.content_strategy?.long_video) {
    contentParts.push(`1 Long Video`);
    statuses.push(jsonData.content_strategy.long_video.status || "pending");
  }

  if (Array.isArray(jsonData?.content_plan) && jsonData.content_plan.length > 0) {
    let postCount = 0;
    jsonData.content_plan.forEach((day: any) => {
      if (Array.isArray(day.posts)) {
        day.posts.forEach((post: any) => {
          postCount++;
          statuses.push(post.status || "pending");
        });
      }
    });
    contentParts.push(`${postCount} Posts`);
  } else if (Array.isArray(jsonData?.posts) && jsonData.posts.length > 0) {
    jsonData.posts.forEach((post: any) => {
      statuses.push(post.status || "pending");
    });
    contentParts.push(`${jsonData.posts.length} Posts`);
  } else if (Array.isArray(jsonData?.captions) && jsonData.captions.length > 0) {
    jsonData.captions.forEach((cap: any) => {
      statuses.push(cap.status || "pending");
    });
    contentParts.push(`${jsonData.captions.length} Captions`);
  }

  if (contentParts.length === 0) {
    const keys = Object.keys(jsonData);
    if (keys.length > 0) {
      contentParts.push(`${keys.length} Sections`);
    } else {
      contentParts.push("Empty");
    }
  }

  return {
    title: title.length > 55 ? title.substring(0, 55) + "..." : title,
    channel,
    contentInfo: contentParts.join(", "),
    statuses
  };
};

export default function TemplatesDashboard() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [platformFilter, setPlatformFilter] = useState<"all" | "youtube" | "facebook">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  const fetchTemplates = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/templates");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch templates");
      setTemplates(data.templates || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const confirmDelete = async () => {
    if (!templateToDelete) return;
    const id = templateToDelete;
    
    setIsDeleting(true);
    setDeleteSuccess(false);

    try {
      const res = await fetch(`/api/templates?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setTemplates((prev) => prev.filter((t) => t.id !== id));
        setDeleteSuccess(true);
        setTimeout(() => {
          setDeleteSuccess(false);
          setTemplateToDelete(null);
        }, 1500);
      }
    } catch (err) {
      console.error("Failed to delete", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "published":
        return <span className="px-2.5 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full border border-blue-200">{status}</span>;
      case "completed":
        return <span className="px-2.5 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full border border-green-200">{status}</span>;
      case "pending":
        return <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded-full border border-amber-200">{status}</span>;
      case "draft":
        return <span className="px-2.5 py-1 bg-slate-100 text-slate-800 text-xs font-semibold rounded-full border border-slate-200">{status}</span>;
      case "closed":
        return <span className="px-2.5 py-1 bg-rose-100 text-rose-800 text-xs font-semibold rounded-full border border-rose-200">{status}</span>;
      default:
        return <span className="px-2.5 py-1 bg-slate-100 text-slate-800 text-xs font-semibold rounded-full border border-slate-200">{status}</span>;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "published": return "bg-blue-500";
      case "completed": return "bg-green-500";
      case "pending": return "bg-amber-400";
      case "draft": return "bg-slate-400";
      case "closed": return "bg-rose-500";
      default: return "bg-slate-200";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FiRefreshCw className="w-8 h-8 text-slate-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-lg border border-red-200">
        <FiAlertCircle className="w-5 h-5" />
        <p>{error}</p>
      </div>
    );
  }

  const ytCount = templates.filter((t) => detectTemplatePlatform(t.json_data) === "youtube").length;
  const fbCount = templates.filter((t) => detectTemplatePlatform(t.json_data) === "facebook").length;

  const filteredTemplates = templates.filter((t) => {
    if (platformFilter === "youtube") return detectTemplatePlatform(t.json_data) === "youtube";
    if (platformFilter === "facebook") return detectTemplatePlatform(t.json_data) === "facebook";
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FiDatabase className="w-6 h-6 text-blue-600" /> Saved Templates
          </h1>
          <p className="text-slate-500 text-sm mt-1">Manage and track YouTube strategies and Facebook content plans saved in your database.</p>
        </div>
        <button
          onClick={fetchTemplates}
          className="p-2 bg-white border border-slate-200 rounded-md hover:bg-slate-50 text-slate-600 shadow-2xs cursor-pointer self-start sm:self-auto"
          title="Refresh"
        >
          <FiRefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Platform Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setPlatformFilter("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            platformFilter === "all"
              ? "bg-gradient-to-r from-[#ff9b8f] to-[#ff7d6e] text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          All Templates ({templates.length})
        </button>
        <button
          onClick={() => setPlatformFilter("youtube")}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            platformFilter === "youtube"
              ? "bg-gradient-to-r from-[#ff9b8f] to-[#ff7d6e] text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-orange-50/50 border border-slate-200"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-red-500"></span>
          YouTube Strategies ({ytCount})
        </button>
        <button
          onClick={() => setPlatformFilter("facebook")}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            platformFilter === "facebook"
              ? "bg-gradient-to-r from-[#ff9b8f] to-[#ff7d6e] text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-orange-50/50 border border-slate-200"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          Facebook Plans ({fbCount})
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-600 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="pr-6 pl-2 sm:px-6 py-4 font-semibold min-w-[200px] w-1/3 sm:w-auto">Topic / Title</th>
                <th className="px-6 py-4 font-semibold min-w-[120px]">Platform</th>
                <th className="px-6 py-4 font-semibold min-w-[140px]">Channel / Page</th>
                <th className="px-6 py-4 font-semibold min-w-[160px]">Content</th>
                <th className="px-6 py-4 font-semibold min-w-[100px]">Status</th>
                <th className="px-6 py-4 font-semibold min-w-[140px]">Updated</th>
                <th className="px-6 py-4 font-semibold text-right min-w-[80px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredTemplates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    No templates found for this filter.
                  </td>
                </tr>
              ) : (
                filteredTemplates.map((template) => {
                  const info = extractTemplateInfo(template.json_data);
                  const platform = detectTemplatePlatform(template.json_data);
                  const contentUrl = getContentUrl(template.id, template.json_data);

                  return (
                    <tr
                      key={template.id}
                      className="hover:bg-slate-50 transition-colors group"
                    >
                      <td className="pr-6 pl-2 sm:px-6 py-4">
                        <Link
                          href={`/json-generator?id=${template.id}`}
                          className="font-medium text-slate-900 hover:text-[#c83a2a] transition-colors"
                        >
                          {info.title}
                        </Link>
                        <div className="text-xs text-slate-400 font-mono mt-1">
                          #{template.id.split("_")[1]?.substring(0, 8) || template.id}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {platform === "youtube" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-700 border border-red-200">
                            YouTube
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
                            Facebook
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-700 font-medium">
                          {info.channel}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5">
                          <Link
                            href={contentUrl}
                            className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-semibold rounded-md transition-colors w-max border text-[#c83a2a] bg-orange-50 hover:bg-orange-100 border-orange-200/80"
                          >
                            {info.contentInfo}
                          </Link>
                          {info.statuses && info.statuses.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1 mt-1 max-w-[240px]">
                              {info.statuses.map((status, idx) => (
                                <div
                                  key={idx}
                                  title={`Item #${idx + 1}: ${status}`}
                                  className={`h-1.5 flex-1 min-w-[8px] max-w-[24px] rounded-full ${getStatusColor(status)}`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(template.status)}
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs">
                        <div className="flex items-center gap-1.5">
                          {new Date(template.updated_at).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => setTemplateToDelete(template.id)}
                            className="p-1.5 flex items-center justify-center text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                            title="Delete Template"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal 
        isOpen={!!templateToDelete} 
        onClose={() => {
          setTemplateToDelete(null);
          setDeleteSuccess(false);
        }} 
        onConfirm={confirmDelete}
        title="Delete Template"
        message="Are you sure you want to delete this template? This action cannot be undone."
        isLoading={isDeleting}
        isSuccess={deleteSuccess}
        successMessage="Template deleted successfully!"
      />
    </div>
  );
}
