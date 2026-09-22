"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { FiEye, FiTrash2, FiClock, FiDatabase, FiRefreshCw, FiAlertCircle } from "react-icons/fi";

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
  } else {
    const searchTitle = (obj: any): string | null => {
      if (!obj || typeof obj !== 'object') return null;
      if (typeof obj.title === 'string') return obj.title;
      if (typeof obj.topic === 'string') return obj.topic;
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
  if (jsonData?.channel_info?.channel_name) {
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch("/api/templates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        setTemplates((prev) =>
          prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
        );
      }
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;
    try {
      const res = await fetch(`/api/templates?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setTemplates((prev) => prev.filter((t) => t.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete", err);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FiDatabase className="w-6 h-6 text-blue-600" /> Saved Templates
          </h1>
          <p className="text-slate-500 mt-1">Manage and track JSON templates saved to your database.</p>
        </div>
        <button
          onClick={fetchTemplates}
          className="p-2 bg-white border border-slate-200 rounded-md hover:bg-slate-50 text-slate-600 shadow-sm"
          title="Refresh"
        >
          <FiRefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-600 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold w-1/3">Topic / Title</th>
                <th className="px-6 py-4 font-semibold">Channel</th>
                <th className="px-6 py-4 font-semibold">Content</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Updated</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {templates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No templates saved yet.
                  </td>
                </tr>
              ) : (
                templates.map((template) => {
                  const info = extractTemplateInfo(template.json_data);
                  return (
                    <tr
                      key={template.id}
                      className="hover:bg-slate-50 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <Link
                          href={`/json-generator?id=${template.id}`}
                          className="font-medium text-slate-900 hover:text-blue-600 transition-colors"
                        >
                          {info.title}
                        </Link>
                        <div className="text-xs text-slate-400 font-mono mt-1">
                          #{template.id.split("_")[1]?.substring(0, 8) || template.id}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-700 font-medium">
                          {info.channel}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5">
                          <Link
                            href={`/content?id=${template.id}`}
                            className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors w-max"
                          >
                            {info.contentInfo}
                          </Link>
                          {info.statuses && info.statuses.length > 0 && (
                            <div className="flex items-center gap-1 mt-1">
                              {info.statuses.map((status, idx) => (
                                <div
                                  key={idx}
                                  title={`Status: ${status}`}
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
                            onClick={() => deleteTemplate(template.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
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
    </div>
  );
}
