"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { FiTrash2, FiRefreshCw, FiAlertCircle, FiPlus, FiShare2, FiCalendar } from "react-icons/fi";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";
import { detectTemplatePlatform } from "@/lib/platformDetector";

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

const extractFacebookInfo = (jsonData: any) => {
  if (!jsonData || typeof jsonData !== "object") {
    return { title: "Untitled Facebook Plan", pageName: "Facebook Page", contentInfo: "No data", statuses: [] };
  }

  const pageName = jsonData?.page_name || jsonData?.channel_info?.channel_name || "Facebook Page";
  let title = jsonData?.theme || jsonData?.title || "";
  let totalPosts = 0;
  const statuses: string[] = [];

  if (Array.isArray(jsonData?.content_plan)) {
    const plan = jsonData.content_plan;
    if (!title && plan[0]?.theme) {
      title = plan[0].theme;
    }
    plan.forEach((day: any) => {
      if (Array.isArray(day.posts)) {
        totalPosts += day.posts.length;
        day.posts.forEach((p: any) => statuses.push(p.status || "pending"));
      }
    });
  } else if (Array.isArray(jsonData?.captions)) {
    totalPosts = jsonData.captions.length;
    if (!title && jsonData.captions[0]?.caption) {
      title = jsonData.captions[0].caption.substring(0, 50);
    }
    jsonData.captions.forEach((c: any) => statuses.push(c.status || "pending"));
  } else if (Array.isArray(jsonData?.posts)) {
    totalPosts = jsonData.posts.length;
    jsonData.posts.forEach((p: any) => statuses.push(p.status || "pending"));
  }

  if (!title) {
    title = `${pageName} Content Plan`;
  }

  const contentInfo = totalPosts > 0 ? `${totalPosts} Posts` : "Social Media Plan";

  return {
    title: title.length > 55 ? title.substring(0, 55) + "..." : title,
    pageName,
    contentInfo,
    statuses,
    totalPosts,
  };
};

export default function FacebookTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
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

      const allTemplates: Template[] = data.templates || [];
      // Filter for Facebook templates only
      const fbTemplates = allTemplates.filter((t) => detectTemplatePlatform(t.json_data) === "facebook");
      setTemplates(fbTemplates);
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
        return <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200/80">Published</span>;
      case "completed":
        return <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200/80">Completed</span>;
      case "pending":
        return <span className="px-2.5 py-1 bg-amber-50 text-amber-800 text-xs font-semibold rounded-full border border-amber-200/80">Pending</span>;
      case "draft":
        return <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full border border-slate-200">Draft</span>;
      default:
        return <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full border border-slate-200">{status}</span>;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "published": return "bg-emerald-500";
      case "completed": return "bg-emerald-500";
      case "pending": return "bg-amber-400";
      case "draft": return "bg-slate-400";
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
      <div className="flex items-center gap-2 p-4 bg-rose-50 text-rose-700 rounded-xl border border-rose-200">
        <FiAlertCircle className="w-5 h-5 shrink-0" />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mt-1">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#1877F2] text-white text-xs font-black">
              f
            </span>
            Facebook Content Plans
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage your Facebook post packages, daily themes, batch copy presets, and page publishing.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <IconButton
            icon={<FiRefreshCw className="w-4 h-4" />}
            title="Refresh"
            variant="secondary"
            size="md"
            isLoading={isLoading}
            onClick={fetchTemplates}
          />
          <Button
            href="/facebook/integration"
            variant="secondary"
            size="md"
            icon={<FiShare2 className="w-4 h-4 text-[#ff7d6e]" />}
          >
            Page Integration
          </Button>
          <Button
            href="/json-generator"
            variant="primary"
            size="md"
            icon={<FiPlus className="w-4 h-4" />}
          >
            New Facebook Plan
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-600 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold min-w-[200px]">Theme / Campaign</th>
                <th className="px-6 py-4 font-semibold min-w-[140px]">Page Name</th>
                <th className="px-6 py-4 font-semibold min-w-[160px]">Posts</th>
                <th className="px-6 py-4 font-semibold min-w-[100px]">Status</th>
                <th className="px-6 py-4 font-semibold min-w-[140px]">Updated</th>
                <th className="px-6 py-4 font-semibold text-right min-w-[80px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {templates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <p className="font-medium text-slate-700">No Facebook content plans saved yet.</p>
                    <p className="text-xs text-slate-400 mt-1">Generate a Facebook content plan or paste JSON in the generator to get started.</p>
                  </td>
                </tr>
              ) : (
                templates.map((template) => {
                  const info = extractFacebookInfo(template.json_data);
                  return (
                    <tr key={template.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4">
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
                        <div className="text-sm text-slate-800 font-semibold flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#ff7d6e]"></span>
                          {info.pageName}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5">
                          <Link
                            href={`/facebook/content?id=${template.id}`}
                            className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-semibold text-[#c83a2a] bg-orange-50 hover:bg-orange-100 rounded-md transition-colors w-max border border-orange-200/80"
                          >
                            <FiCalendar className="w-3.5 h-3.5 mr-1" />
                            {info.contentInfo}
                          </Link>
                          {info.statuses && info.statuses.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1 mt-1 max-w-[240px]">
                              {info.statuses.map((status, idx) => (
                                <div
                                  key={idx}
                                  title={`Post #${idx + 1}: ${status}`}
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
                        {new Date(template.updated_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-3">
                          <IconButton
                            icon={<FiTrash2 className="w-4 h-4" />}
                            title="Delete Plan"
                            variant="danger"
                            size="sm"
                            onClick={() => setTemplateToDelete(template.id)}
                          />
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
        title="Delete Facebook Plan"
        message="Are you sure you want to delete this Facebook content plan? This action cannot be undone."
        confirmText="Delete"
        isLoading={isDeleting}
        isSuccess={deleteSuccess}
        successMessage="Plan deleted successfully!"
        onConfirm={confirmDelete}
        onClose={() => {
          setTemplateToDelete(null);
          setDeleteSuccess(false);
        }}
      />
    </div>
  );
}
