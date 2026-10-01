"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FiArrowLeft,
  FiRefreshCw,
  FiAlertCircle,
  FiSave,
  FiCheck,
  FiCopy,
  FiMic,
  FiSearch,
} from "react-icons/fi";

type ContentItem = {
  id: string;
  type: "short" | "long_video";
  title: string;
  description: string;
  script: string;
  tags: string;
  tags_count: number;
  search_keywords: string;
  status: string;
  original_ref: any;
};

export default function YouTubeContentPage() {
  const [template, setTemplate] = useState<any>(null);
  const [items, setItems] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadingItems, setDownloadingItems] = useState<{ [key: string]: boolean }>({});

  const router = useRouter();

  const handleSendToVoice = (text: string, type?: string, title?: string) => {
    const contentText = text?.trim();
    if (!contentText) {
      alert("No script or text available for voiceover.");
      return;
    }
    if (typeof window !== "undefined") {
      localStorage.setItem("pending_voice_script", contentText);
      if (type) {
        localStorage.setItem("pending_voice_format", type === "long_video" ? "long" : "short");
      }
      if (title) {
        localStorage.setItem("pending_voice_title", title);
      }
    }
    router.push("/?from=content");
  };

  const formatTags = (tags: any) => {
    if (!Array.isArray(tags)) {
      if (typeof tags === "string") {
        return tags
          .split(",")
          .map((t) => {
            const trimmed = t.trim();
            return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
          })
          .join(", ");
      }
      return "";
    }
    return tags
      .map((t: string) => {
        const trimmed = typeof t === "string" ? t.trim() : String(t).trim();
        return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
      })
      .join(", ");
  };

  const formatKeywords = (keywords: any) => {
    if (!Array.isArray(keywords)) {
      if (typeof keywords === "string") return keywords;
      return "";
    }
    return keywords
      .map((k: any) => {
        if (typeof k === "string") return k.trim();
        if (typeof k === "object" && k.keyword) return k.keyword.trim();
        return "";
      })
      .filter(Boolean)
      .join(", ");
  };

  const fetchContent = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/templates?id=${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch template");

      const fetchedTemplate = data.template;
      setTemplate(fetchedTemplate);

      const strategy = fetchedTemplate.json_data?.content_strategy;
      const parsedItems: ContentItem[] = [];

      if (strategy) {
        if (strategy.long_video) {
          parsedItems.push({
            id: strategy.long_video.id || "long_1",
            type: "long_video",
            title: strategy.long_video.title || "Untitled Long Video",
            description: strategy.long_video.description || "No description",
            script: strategy.long_video.script || "No script",
            tags: formatTags(strategy.long_video.tags),
            tags_count: Array.isArray(strategy.long_video.tags) ? strategy.long_video.tags.length : 0,
            search_keywords: formatKeywords(
              strategy.long_video.search_keywords ||
                strategy.long_video.media_search_keywords ||
                strategy.long_video.keywords
            ),
            status: strategy.long_video.status || "pending",
            original_ref: strategy.long_video,
          });
        }

        if (Array.isArray(strategy.shorts)) {
          strategy.shorts.forEach((short: any, index: number) => {
            parsedItems.push({
              id: short.id || `short_${index}`,
              type: "short",
              title: short.title || `Untitled Short ${index + 1}`,
              description: short.description || "No description",
              script: short.script || "No script",
              tags: formatTags(short.tags),
              tags_count: Array.isArray(short.tags) ? short.tags.length : 0,
              search_keywords: formatKeywords(
                short.search_keywords || short.media_search_keywords || short.keywords
              ),
              status: short.status || "pending",
              original_ref: short,
            });
          });
        }
      }

      setItems(parsedItems);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (id) {
      fetchContent(id);
    } else {
      setError("No Template ID provided");
      setIsLoading(false);
    }
  }, []);

  const handleCopy = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleStatusChange = (itemId: string, newStatus: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          item.original_ref.status = newStatus;
          return { ...item, status: newStatus };
        }
        return item;
      })
    );
  };

  const handleFetchByKeywords = async (item: ContentItem) => {
    let keywords: { keyword: string; quantity_to_download?: number }[] = [];

    const searchKeywords =
      item.original_ref?.search_keywords || item.original_ref?.media_search_keywords;

    if (Array.isArray(searchKeywords)) {
      searchKeywords.forEach((k) => {
        if (typeof k === "object" && k.keyword) {
          keywords.push({ keyword: k.keyword, quantity_to_download: k.quantity_to_download });
        } else if (typeof k === "string") {
          keywords.push({ keyword: k.trim() });
        }
      });
    } else {
      Object.entries(item.original_ref).forEach(([key, val]) => {
        if (key.toLowerCase().includes("keyword")) {
          if (typeof val === "string") {
            val.split(",").forEach((s) => keywords.push({ keyword: s.trim() }));
          } else if (Array.isArray(val)) {
            val.forEach((v) => {
              if (typeof v === "string") keywords.push({ keyword: v.trim() });
            });
          }
        }
      });
    }

    keywords = keywords.filter((k) => k.keyword && k.keyword.length > 0);

    if (keywords.length === 0) {
      alert("No search keywords found in this item.");
      return;
    }

    setDownloadingItems((prev) => ({ ...prev, [`${item.id}_keywords`]: true }));

    try {
      const filters = {
        orientation: item.type === "long_video" ? "landscape" : "portrait",
        image_type: "video",
      };

      const res = await fetch(`/api/media/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_id: item.id,
          keywords,
          filters,
        }),
      });

      if (!res.ok) throw new Error("Failed to start keyword search");

      alert("Keyword media search started in the background!");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to start background search");
    } finally {
      setTimeout(() => {
        setDownloadingItems((prev) => ({ ...prev, [`${item.id}_keywords`]: false }));
      }, 3000);
    }
  };

  const saveChanges = async () => {
    if (!template) return;
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch("/api/templates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: template.id,
          json_data: template.json_data,
        }),
      });

      if (!res.ok) throw new Error("Failed to save changes");

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    } finally {
      setIsSaving(false);
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
      <div className="space-y-4">
        <Link
          href="/youtube/templates"
          className="inline-flex items-center gap-2 text-sm text-red-600 hover:underline"
        >
          <FiArrowLeft /> Back to YouTube Strategies
        </Link>
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-lg border border-red-200">
          <FiAlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const mainTitle = template?.json_data?.content_strategy?.long_video?.title || template?.json_data?.topic || "YouTube Content Strategy";

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/youtube/templates"
            className="inline-flex items-center gap-2 text-sm text-red-600 hover:underline mb-1 font-medium"
          >
            <FiArrowLeft /> Back to YouTube Strategies
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2 line-clamp-1">
            {mainTitle}
          </h1>
          <p className="text-slate-500 font-mono text-xs">
            Template: #{template.id.split("_")[1]?.substring(0, 8) || template.id} • {items.length} Videos
          </p>
        </div>

        <button
          onClick={saveChanges}
          disabled={isSaving}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-xs cursor-pointer ${
            saveSuccess
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "bg-red-600 hover:bg-red-700 text-white disabled:opacity-70"
          }`}
        >
          {isSaving ? (
            <>
              <FiRefreshCw className="w-4 h-4 animate-spin" /> Saving...
            </>
          ) : saveSuccess ? (
            <>
              <FiCheck className="w-4 h-4" /> Changes Saved!
            </>
          ) : (
            <>
              <FiSave className="w-4 h-4" /> Save Status Changes
            </>
          )}
        </button>
      </div>

      {/* Video Format Legend */}
      <div className="flex items-center gap-5 px-1 pb-1">
        <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700">
          <span className="w-3.5 h-3.5 rounded bg-red-100 border border-red-300"></span> Short Videos
        </span>
        <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700">
          <span className="w-3.5 h-3.5 rounded bg-purple-100 border border-purple-300"></span> Long Videos
        </span>
      </div>

      {/* Structured Video Strategy Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-600 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-4 font-semibold w-[20%]">Title</th>
                <th className="px-4 py-4 font-semibold w-[25%]">Description</th>
                <th className="px-4 py-4 font-semibold w-[25%]">Script</th>
                <th className="px-2 py-4 font-semibold text-right w-28">Status</th>
                <th className="px-4 py-4 font-semibold text-center w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No video content strategy found in this template.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.id}
                    className={`transition-colors ${
                      item.status === "published"
                        ? "bg-green-50/60 hover:bg-green-100/60"
                        : item.type === "short"
                        ? "bg-red-50/40 hover:bg-red-50/80"
                        : "bg-purple-50/40 hover:bg-purple-50/80"
                    }`}
                  >
                    {/* Title */}
                    <td className="px-4 py-4 align-top group relative">
                      <div className="relative">
                        <Link
                          href={`/youtube/content/detail?templateId=${template.id}&itemId=${item.id}`}
                          className="font-semibold text-slate-900 hover:text-red-600 break-words text-left line-clamp-3 pr-6 transition-colors"
                          title="Click to view full details"
                        >
                          {item.title}
                        </Link>
                        <button
                          onClick={() => handleCopy(item.title, `${item.id}-title`)}
                          className="absolute top-0 -right-2 flex items-center justify-center p-1 text-slate-400 hover:text-red-600 transition-opacity cursor-pointer opacity-0 group-hover:opacity-100"
                          title="Copy Title"
                        >
                          {copiedId === `${item.id}-title` ? (
                            <FiCheck className="w-4 h-4 text-green-500" />
                          ) : (
                            <FiCopy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Description */}
                    <td className="px-4 py-4 align-top group relative">
                      <div className="relative">
                        <span
                          className="text-slate-600 text-xs line-clamp-6 pr-6 leading-relaxed block"
                          title={item.description}
                        >
                          {item.description}
                        </span>
                        <button
                          onClick={() => handleCopy(item.description, `${item.id}-desc`)}
                          className="absolute top-0 -right-2 flex items-center justify-center p-1 text-slate-400 hover:text-red-600 transition-opacity cursor-pointer opacity-0 group-hover:opacity-100"
                          title="Copy Description"
                        >
                          {copiedId === `${item.id}-desc` ? (
                            <FiCheck className="w-4 h-4 text-green-500" />
                          ) : (
                            <FiCopy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Script */}
                    <td className="px-4 py-4 align-top group relative">
                      <div className="relative">
                        <span
                          className="text-slate-600 text-xs line-clamp-6 pr-6 leading-relaxed block font-mono"
                          title={item.script}
                        >
                          {item.script}
                        </span>
                        <button
                          onClick={() => handleCopy(item.script, `${item.id}-script`)}
                          className="absolute top-0 -right-2 flex items-center justify-center p-1 text-slate-400 hover:text-red-600 transition-opacity cursor-pointer opacity-0 group-hover:opacity-100"
                          title="Copy Script"
                        >
                          {copiedId === `${item.id}-script` ? (
                            <FiCheck className="w-4 h-4 text-green-500" />
                          ) : (
                            <FiCopy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Status Dropdown */}
                    <td className="px-2 py-4 align-top text-right w-28">
                      <select
                        value={item.status}
                        onChange={(e) => handleStatusChange(item.id, e.target.value)}
                        className={`text-xs font-semibold border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-red-500 w-full cursor-pointer shadow-2xs ${
                          item.type === "short"
                            ? "bg-red-50 border-red-200 text-red-900"
                            : "bg-purple-50 border-purple-200 text-purple-900"
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="draft">Draft</option>
                        <option value="completed">Completed</option>
                        <option value="published">Published</option>
                      </select>
                    </td>

                    {/* Actions: Generate Media & Voice */}
                    <td className="px-4 py-4 align-top text-right w-24">
                      <div className="flex gap-2 items-center justify-end">
                        <button
                          onClick={() => handleFetchByKeywords(item)}
                          disabled={downloadingItems[`${item.id}_keywords`]}
                          className="flex items-center justify-center p-1.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-slate-400 disabled:to-slate-400 text-white rounded-lg shadow-2xs transition-all cursor-pointer"
                          title="Generate Media"
                        >
                          {downloadingItems[`${item.id}_keywords`] ? (
                            <FiRefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <FiSearch className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() =>
                            handleSendToVoice(item.script || item.description, item.type, item.title)
                          }
                          disabled={!item.script && !item.description}
                          className="flex items-center justify-center p-1.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 disabled:from-slate-400 disabled:to-slate-400 text-white rounded-lg shadow-2xs transition-all cursor-pointer"
                          title="Generate Voice"
                        >
                          <FiMic className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
