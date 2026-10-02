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
  FiTag,
  FiLayers,
  FiChevronDown,
  FiX,
  FiShare2,
  FiExternalLink,
} from "react-icons/fi";
import { FaFacebook } from "react-icons/fa";
import Pagination from "@/components/ui/Pagination";
import { Button, IconButton } from "@/components/ui";

type ContentItem = {
  id: string;
  type: "post" | "caption";
  title: string;
  description: string;
  script: string;
  tags: string;
  tags_count: number;
  search_keywords: string;
  status: string;
  original_ref: any;
};

const PAGE_SIZE = 10;

export default function FacebookContentPage() {
  const router = useRouter();
  const [template, setTemplate] = useState<any>(null);
  const [items, setItems] = useState<ContentItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Bulk copy & selection states
  const [isCopyMenuOpen, setIsCopyMenuOpen] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [customRangeStart, setCustomRangeStart] = useState<string>("1");
  const [customRangeEnd, setCustomRangeEnd] = useState<string>("5");
  const [copyNotification, setCopyNotification] = useState<string | null>(null);
  const [includeDescription, setIncludeDescription] = useState<boolean>(true);
  const [includeTags, setIncludeTags] = useState<boolean>(true);

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

      const parsedItems: ContentItem[] = [];

      // 1. Social Media Content Plan (content_plan array with days and posts)
      if (Array.isArray(fetchedTemplate.json_data?.content_plan)) {
        fetchedTemplate.json_data.content_plan.forEach((day: any, dayIdx: number) => {
          if (Array.isArray(day.posts)) {
            day.posts.forEach((post: any, postIdx: number) => {
              const postNum = post.post_number ?? postIdx + 1;
              parsedItems.push({
                id: post.id || `post_${dayIdx}_${postIdx}`,
                type: "post",
                title: `Post #${postNum}${post.time ? ` • ${post.time}` : ""}${day.theme ? ` (${day.theme})` : ""
                  }`,
                description: post.caption || "No caption",
                script: post.generation_prompt || post.caption || "No script/prompt",
                tags: formatTags(post.tags),
                tags_count: Array.isArray(post.tags) ? post.tags.length : 0,
                search_keywords: formatKeywords(post.tags),
                status: post.status || "pending",
                original_ref: post,
              });
            });
          }
        });
      }
      // 2. Captions List ({ "captions": [...] })
      else if (Array.isArray(fetchedTemplate.json_data?.captions)) {
        fetchedTemplate.json_data.captions.forEach((cap: any, capIdx: number) => {
          const capNum = cap.number ?? capIdx + 1;
          parsedItems.push({
            id: cap.id || `cap_${capIdx}`,
            type: "caption",
            title: `Caption #${capNum}`,
            description: cap.caption || "No caption",
            script: cap.caption || "No script",
            tags: formatTags(cap.tags),
            tags_count: Array.isArray(cap.tags) ? cap.tags.length : 0,
            search_keywords: formatKeywords(cap.tags),
            status: cap.status || "pending",
            original_ref: cap,
          });
        });
      }
      // 3. Standalone posts array ({ "posts": [...] })
      else if (Array.isArray(fetchedTemplate.json_data?.posts)) {
        fetchedTemplate.json_data.posts.forEach((post: any, postIdx: number) => {
          const postNum = post.post_number ?? postIdx + 1;
          parsedItems.push({
            id: post.id || `post_${postIdx}`,
            type: "post",
            title: `Post #${postNum}${post.time ? ` • ${post.time}` : ""}`,
            description: post.caption || "No caption",
            script: post.generation_prompt || post.caption || "No script/prompt",
            tags: formatTags(post.tags),
            tags_count: Array.isArray(post.tags) ? post.tags.length : 0,
            search_keywords: formatKeywords(post.tags),
            status: post.status || "pending",
            original_ref: post,
          });
        });
      }
      // 4. Fallback root array
      else if (Array.isArray(fetchedTemplate.json_data)) {
        fetchedTemplate.json_data.forEach((item: any, idx: number) => {
          parsedItems.push({
            id: item.id || `item_${idx}`,
            type: "post",
            title: item.title || (item.number ? `Caption #${item.number}` : `Post #${idx + 1}`),
            description: item.caption || item.description || "No description",
            script: item.script || item.generation_prompt || item.caption || "",
            tags: formatTags(item.tags),
            tags_count: Array.isArray(item.tags) ? item.tags.length : 0,
            search_keywords: formatKeywords(item.tags || item.keywords),
            status: item.status || "pending",
            original_ref: item,
          });
        });
      }

      setItems(parsedItems);
    } catch (err: any) {
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
      setError("No Facebook Plan ID provided");
      setIsLoading(false);
    }
  }, []);

  const handleCopy = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendToFacebookStudio = (item: ContentItem) => {
    const payload = {
      title: item.title,
      caption: `${item.description && item.description !== "No description" ? item.description : item.script}\n\n${item.tags}`,
      type: item.type === "post" ? "post" : "reel",
      templateId: template?.id,
      itemId: item.id,
    };
    sessionStorage.setItem("fb_composer_prefill", JSON.stringify(payload));
    router.push("/facebook/integration");
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

  const showCopyNotification = (msg: string) => {
    setCopyNotification(msg);
    setTimeout(() => {
      setCopyNotification((current) => (current === msg ? null : current));
    }, 2800);
  };

  const handleToggleSelect = (id: string) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedItemIds(new Set(items.map((i) => i.id)));
  };

  const handleClearSelection = () => {
    setSelectedItemIds(new Set());
  };

  const formatItemForClipboard = (item: ContentItem, index?: number) => {
    const parts: string[] = [];

    if (includeDescription) {
      const isGenericTitle =
        !item.title ||
        /^item\s*#?\d+$/i.test(item.title.trim()) ||
        /^caption\s*#?\d+$/i.test(item.title.trim()) ||
        /^post\s*#?\d+$/i.test(item.title.trim()) ||
        /^untitled/i.test(item.title.trim());

      if (!isGenericTitle && item.title !== item.description && !item.title.startsWith("Post #")) {
        parts.push(item.title);
      }

      const text =
        item.description && item.description !== "No description"
          ? item.description
          : item.script && item.script !== "No script"
            ? item.script
            : "";

      if (text) {
        parts.push(text);
      }
    }

    if (includeTags && item.tags) {
      const formattedTags = item.tags
        .split(",")
        .map((t) => {
          const tr = t.trim();
          return tr.startsWith("#") ? tr : `#${tr}`;
        })
        .filter(Boolean)
        .join(" ");
      if (formattedTags) {
        parts.push(formattedTags);
      }
    }

    const content = parts.join("\n\n");
    if (!content) return "";

    if (index !== undefined) {
      return `${index}. ${content}`;
    }
    return content;
  };

  const handleCopyBatch = async (itemsToCopy: ContentItem[], label: string) => {
    if (itemsToCopy.length === 0) {
      alert("No items to copy.");
      return;
    }

    const textToCopy = itemsToCopy
      .map((item) => {
        const itemIndex = items.findIndex((i) => i.id === item.id) + 1;
        return formatItemForClipboard(item, itemIndex > 0 ? itemIndex : undefined);
      })
      .filter(Boolean)
      .join("\n\n");

    try {
      await navigator.clipboard.writeText(textToCopy);
      showCopyNotification(`Copied ${itemsToCopy.length} items (${label}) to clipboard!`);
      setIsCopyMenuOpen(false);
    } catch (err) {
      console.error("Failed to copy batch", err);
    }
  };

  const handleCopyFullItem = async (item: ContentItem) => {
    const captionText =
      item.description && item.description !== "No description"
        ? item.description
        : item.script && item.script !== "No script"
          ? item.script
          : "";

    const formattedTags = item.tags
      ? item.tags
        .split(",")
        .map((t) => {
          const tr = t.trim();
          return tr.startsWith("#") ? tr : `#${tr}`;
        })
        .filter(Boolean)
        .join(" ")
      : "";

    const text = [captionText, formattedTags].filter(Boolean).join("\n\n");
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(`${item.id}-full`);
      const itemIndex = items.findIndex((i) => i.id === item.id) + 1;
      showCopyNotification(`Copied post #${itemIndex} to clipboard!`);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy item", err);
    }
  };

  const handleCopyCustomRange = () => {
    const start = parseInt(String(customRangeStart), 10);
    const end = parseInt(String(customRangeEnd), 10);

    if (isNaN(start) || isNaN(end) || start < 1 || end < start) {
      alert("Please enter a valid range (e.g. From 6 to 8).");
      return;
    }

    const clampedStart = Math.max(1, start);
    const clampedEnd = Math.min(items.length, end);
    const rangeItems = items.slice(clampedStart - 1, clampedEnd);

    if (rangeItems.length === 0) {
      alert("No items found in this range.");
      return;
    }

    handleCopyBatch(rangeItems, `Posts ${clampedStart} to ${clampedEnd}`);
  };

  const handleCopySelected = () => {
    const selected = items.filter((i) => selectedItemIds.has(i.id));
    if (selected.length === 0) {
      alert("Please select at least one item using the checkboxes.");
      return;
    }
    handleCopyBatch(selected, `${selected.length} Selected items`);
  };

  const generateChunks = (total: number, chunkSize: number) => {
    const chunks: { start: number; end: number }[] = [];
    for (let i = 0; i < total; i += chunkSize) {
      chunks.push({
        start: i + 1,
        end: Math.min(i + chunkSize, total),
      });
    }
    return chunks;
  };

  const chunksOf5 = generateChunks(items.length, 5);
  const chunksOf10 = generateChunks(items.length, 10);

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
          href="/facebook/templates"
          className="inline-flex items-center gap-2 text-sm text-[#c83a2a] hover:underline font-medium"
        >
          <FiArrowLeft /> Back to Facebook Plans
        </Link>
        <div className="flex items-center gap-2 p-4 bg-rose-50 text-rose-700 rounded-xl border border-rose-200">
          <FiAlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const pageName = template?.json_data?.page_name || "Facebook Page";
  const mainTitle = (() => {
    if (!template?.json_data) return "Facebook Content Plan";
    const jsonData = template.json_data;
    if (Array.isArray(jsonData.content_plan) && jsonData.content_plan[0]?.theme) {
      return jsonData.content_plan[0].theme;
    }
    if (jsonData.theme) return jsonData.theme;
    if (jsonData.title) return jsonData.title;
    if (jsonData.page_name) return `${jsonData.page_name} Content Campaign`;
    if (Array.isArray(jsonData.captions)) return `${jsonData.captions.length} Captions Plan`;
    return "Facebook Content Plan";
  })();

  const filteredItems =
    statusFilter === "all"
      ? items
      : items.filter((item) => (item.status || "pending").toLowerCase() === statusFilter);

  const totalPages = Math.ceil(filteredItems.length / PAGE_SIZE) || 1;
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const pendingCount = items.filter((i) => (i.status || "pending").toLowerCase() === "pending").length;
  const completedCount = items.filter((i) => (i.status || "").toLowerCase() === "completed").length;
  const publishedCount = items.filter((i) => (i.status || "").toLowerCase() === "published").length;
  const draftCount = items.filter((i) => (i.status || "").toLowerCase() === "draft").length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/facebook/templates"
            className="inline-flex items-center gap-2 text-sm text-[#c83a2a] hover:underline mb-1 font-medium"
          >
            <FiArrowLeft /> Back to Facebook Plans
          </Link>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-orange-50 text-[#c83a2a] border border-orange-200/80 uppercase tracking-wider">
              {pageName}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2 line-clamp-1 mt-0.5">
            {mainTitle}
          </h1>
          <div className="flex items-center gap-2 text-slate-500 font-mono text-xs">
            <span>Plan: #{template.id.split("_")[1]?.substring(0, 8) || template.id}</span>
            <span>•</span>
            <span>{items.length} Total Posts</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 relative">
          <Button
            href={`/facebook/integration?templateId=${template.id}`}
            variant="secondary"
            size="md"
            icon={<FiShare2 className="w-4 h-4 text-[#ff7d6e]" />}
            hideTextOnMobile={true}
          >
            Page Integration
          </Button>

          {/* Copy Options Dropdown Button */}
          <div className="relative">
            <button
              onClick={() => setIsCopyMenuOpen((prev) => !prev)}
              className="inline-flex items-center justify-center h-9 px-0 sm:px-3.5 w-9 sm:w-auto rounded-xl text-sm font-semibold bg-white text-slate-700 border border-slate-200 hover:bg-orange-50/50 hover:border-[#ff9b8f]/60 transition-colors shadow-2xs cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff9b8f]/40"
              title="Open Copy Options"
            >
              <FiCopy className="w-4 h-4 text-[#ff7d6e] shrink-0" />
              <span className="hidden sm:inline ml-2">Copy Content</span>
              {selectedItemIds.size > 0 && (
                <span className="hidden sm:inline-flex ml-2 px-1.5 py-0.2 bg-[#ff7d6e] text-white text-[11px] font-bold rounded-full">
                  {selectedItemIds.size}
                </span>
              )}
              <FiChevronDown
                className={`hidden sm:inline ml-1 w-3.5 h-3.5 transition-transform duration-200 ${isCopyMenuOpen ? "rotate-180" : ""
                  }`}
              />
            </button>

            {/* Dropdown Popover */}
            {isCopyMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsCopyMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-[320px] sm:w-[380px] bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 p-4 space-y-4 max-h-[85vh] overflow-y-auto">
                  {/* Popover Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <FiCopy className="w-4 h-4 text-[#ff7d6e]" />
                      <h4 className="text-sm font-bold text-slate-800">
                        Copy Facebook Content
                      </h4>
                    </div>
                    <button
                      onClick={() => setIsCopyMenuOpen(false)}
                      className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Content Filter Checkboxes */}
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Include:
                    </span>
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={includeDescription}
                        onChange={(e) => {
                          if (!e.target.checked && !includeTags) return;
                          setIncludeDescription(e.target.checked);
                        }}
                        className="w-4 h-4 accent-[#ff7d6e] rounded border-slate-300 cursor-pointer"
                      />
                      <span>Caption</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={includeTags}
                        onChange={(e) => {
                          if (!e.target.checked && !includeDescription) return;
                          setIncludeTags(e.target.checked);
                        }}
                        className="w-4 h-4 accent-[#ff7d6e] rounded border-slate-300 cursor-pointer"
                      />
                      <span>Tags / Hashtags</span>
                    </label>
                  </div>

                  {/* 1. Copy All Button */}
                  <div>
                    <button
                      onClick={() => handleCopyBatch(items, `All ${items.length} posts`)}
                      className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 bg-gradient-to-r from-[#ff9b8f] to-[#ff7d6e] hover:from-[#f8887a] hover:to-[#f05a48] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                    >
                      <FiCopy className="w-3.5 h-3.5" />
                      Copy All ({items.length} Posts)
                    </button>
                  </div>

                  {/* 2. Chunks of 5 */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Chunks of 5 Posts
                      </span>
                      <span className="text-[10px] text-slate-400">Pehle 5, agle 5, etc.</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {chunksOf5.map((chunk, idx) => (
                        <button
                          key={idx}
                          onClick={() =>
                            handleCopyBatch(
                              items.slice(chunk.start - 1, chunk.end),
                              `Posts ${chunk.start}-${chunk.end}`
                            )
                          }
                          className="px-2 py-1.5 bg-slate-50 hover:bg-orange-50 hover:text-[#c83a2a] hover:border-orange-300 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1"
                          title={`Copy posts ${chunk.start} to ${chunk.end}`}
                        >
                          <span>{chunk.start} - {chunk.end}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3. Chunks of 10 */}
                  {items.length > 5 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          Chunks of 10 Posts
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {chunksOf10.map((chunk, idx) => (
                          <button
                            key={idx}
                            onClick={() =>
                              handleCopyBatch(
                                items.slice(chunk.start - 1, chunk.end),
                                `Posts ${chunk.start}-${chunk.end}`
                              )
                            }
                            className="px-2.5 py-1.5 bg-slate-50 hover:bg-orange-50 hover:text-[#c83a2a] hover:border-orange-300 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1"
                            title={`Copy posts ${chunk.start} to ${chunk.end}`}
                          >
                            <span>Posts {chunk.start} - {chunk.end}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 4. Custom Range (e.g. 6 to 8) */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                      Custom Range (e.g. 6 to 8)
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-xs text-slate-600">
                        <span>From:</span>
                        <input
                          type="number"
                          min={1}
                          max={items.length}
                          value={customRangeStart}
                          onChange={(e) => setCustomRangeStart(e.target.value)}
                          className="w-14 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 text-center focus:outline-none focus:ring-2 focus:ring-[#ff9b8f]/25 focus:border-[#ff9b8f]"
                        />
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-600">
                        <span>To:</span>
                        <input
                          type="number"
                          min={1}
                          max={items.length}
                          value={customRangeEnd}
                          onChange={(e) => setCustomRangeEnd(e.target.value)}
                          className="w-14 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 text-center focus:outline-none focus:ring-2 focus:ring-[#ff9b8f]/25 focus:border-[#ff9b8f]"
                        />
                      </div>
                      <button
                        onClick={handleCopyCustomRange}
                        className="flex-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        Copy Range
                      </button>
                    </div>
                  </div>

                  {/* 5. Checkbox Selection */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Checkbox Selected ({selectedItemIds.size})
                      </span>
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <button
                          onClick={handleSelectAll}
                          className="text-[#c83a2a] hover:underline cursor-pointer font-medium"
                        >
                          Select All
                        </button>
                        <span>•</span>
                        <button
                          onClick={handleClearSelection}
                          className="text-slate-500 hover:underline cursor-pointer font-medium"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    {selectedItemIds.size > 0 ? (
                      <button
                        onClick={handleCopySelected}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                      >
                        <FiCheck className="w-3.5 h-3.5" />
                        Copy Selected ({selectedItemIds.size} Posts)
                      </button>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">
                        Tip: You can tick checkboxes on individual cards to copy any specific combination.
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Save Status Changes Button */}
          <Button
            onClick={saveChanges}
            disabled={isSaving}
            isLoading={isSaving}
            size="md"
            variant="primary"
            className={saveSuccess ? "!bg-emerald-600 hover:!bg-emerald-700 text-white" : ""}
            icon={saveSuccess ? <FiCheck className="w-4 h-4" /> : <FiSave className="w-4 h-4" />}
            hideTextOnMobile={true}
          >
            {saveSuccess ? "Changes Saved!" : "Save Status Changes"}
          </Button>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 pb-1 border-b border-slate-200">
        <button
          onClick={() => {
            setStatusFilter("all");
            setCurrentPage(1);
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${statusFilter === "all"
            ? "bg-slate-900 text-white shadow-2xs"
            : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
        >
          All ({items.length})
        </button>
        <button
          onClick={() => {
            setStatusFilter("pending");
            setCurrentPage(1);
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${statusFilter === "pending"
            ? "bg-amber-500 text-white shadow-2xs"
            : "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200"
            }`}
        >
          Pending ({pendingCount})
        </button>
        {completedCount > 0 && (
          <button
            onClick={() => {
              setStatusFilter("completed");
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${statusFilter === "completed"
              ? "bg-emerald-600 text-white shadow-2xs"
              : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200"
              }`}
          >
            Completed ({completedCount})
          </button>
        )}
        {publishedCount > 0 && (
          <button
            onClick={() => {
              setStatusFilter("published");
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${statusFilter === "published"
              ? "bg-gradient-to-r from-[#ff9b8f] to-[#ff7d6e] text-white shadow-xs"
              : "bg-orange-50 text-[#c83a2a] hover:bg-orange-100 border border-orange-200"
              }`}
          >
            Published ({publishedCount})
          </button>
        )}
        {draftCount > 0 && (
          <button
            onClick={() => {
              setStatusFilter("draft");
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${statusFilter === "draft"
              ? "bg-slate-600 text-white shadow-2xs"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
              }`}
          >
            Draft ({draftCount})
          </button>
        )}
      </div>

      {/* Selected Items Quick Action Bar */}
      {selectedItemIds.size > 0 && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-orange-50 border border-orange-200/80 rounded-xl text-orange-950 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold bg-[#ff7d6e] text-white px-2 py-0.5 rounded-full">
              {selectedItemIds.size}
            </span>
            <span className="text-xs font-semibold text-orange-950">
              post{selectedItemIds.size > 1 ? "s" : ""} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySelected}
              className="px-3 py-1.5 bg-gradient-to-r from-[#ff9b8f] to-[#ff7d6e] hover:from-[#f8887a] hover:to-[#f05a48] text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <FiCopy className="w-3.5 h-3.5" />
              Copy Selected
            </button>
            <button
              onClick={handleClearSelection}
              className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-800 font-medium cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Items List rendered as Boxes / Cards */}
      {paginatedItems.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200/80 rounded-2xl text-slate-500 space-y-2">
          <FiLayers className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="font-medium text-slate-700">No Facebook posts found.</p>
          {statusFilter !== "all" && (
            <p className="text-xs text-slate-400">
              No posts matching &quot;{statusFilter}&quot;. Try switching to &quot;All&quot;.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedItems.map((item) => {
            const itemIndex = items.findIndex((i) => i.id === item.id) + 1;
            const isSelected = selectedItemIds.has(item.id);

            return (
              <div
                key={item.id}
                className={`bg-white border rounded-2xl p-4 sm:p-5 shadow-xs transition-all space-y-3.5 ${isSelected
                  ? "ring-2 ring-[#ff7d6e]/40 border-[#ff7d6e]"
                  : item.status === "published"
                    ? "border-emerald-200/80 hover:border-emerald-300"
                    : item.status === "completed"
                      ? "border-green-200/80 hover:border-green-300"
                      : "border-slate-200/80 hover:border-slate-300"
                  }`}
              >
                {/* Box Header: Checkbox + Number + Title + Copy Post + Status Dropdown */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelect(item.id)}
                      className="w-4 h-4 accent-[#ff7d6e] rounded border-slate-300 cursor-pointer shrink-0"
                      title="Select this post"
                    />
                    <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold shrink-0 bg-slate-900 text-white">
                      #{itemIndex}
                    </span>
                    <Link
                      href={`/facebook/content/detail?templateId=${template.id}&itemId=${item.id}`}
                      className="font-bold text-base text-slate-900 hover:text-[#c83a2a] transition-colors truncate flex items-center gap-1.5"
                      title="View post detail & preview"
                    >
                      <span>{item.title}</span>
                      <FiExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </Link>
                  </div>

                  {/* Header Right Area: Copy Post Button + Status Dropdown */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="xs"
                      variant="soft"
                      onClick={() => handleCopyFullItem(item)}
                      icon={copiedId === `${item.id}-full` ? <FiCheck className="w-3.5 h-3.5 text-emerald-500" /> : <FiCopy className="w-3.5 h-3.5" />}
                      title="Copy Single Post (Caption + Tags, without item number or commas)"
                    >
                      {copiedId === `${item.id}-full` ? "Copied" : "Copy Post"}
                    </Button>

                    <Button
                      size="xs"
                      onClick={() => handleSendToFacebookStudio(item)}
                      icon={<FaFacebook className="w-3.5 h-3.5 text-blue-600" />}
                      className="bg-blue-50/70 hover:bg-blue-100/80 text-blue-700 border border-blue-200/80"
                      title="Open in Facebook & Instagram Studio"
                    >
                      FB Studio
                    </Button>

                    <div className="flex items-center gap-1.5 ml-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Status:
                      </span>
                      <select
                        value={item.status}
                        onChange={(e) => handleStatusChange(item.id, e.target.value)}
                        className={`text-xs font-semibold rounded-xl px-2.5 py-1.5 border transition-colors cursor-pointer shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#ff9b8f]/25 focus:border-[#ff9b8f] ${item.status === "published"
                          ? "bg-orange-50 text-[#c83a2a] border-orange-200"
                          : item.status === "completed"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : item.status === "draft"
                              ? "bg-slate-100 text-slate-700 border-slate-300"
                              : "bg-amber-50 text-amber-800 border-amber-300"
                          }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="draft">Draft</option>
                        <option value="completed">Completed</option>
                        <option value="published">Published</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Description / Caption */}
                {item.description && item.description !== "No description" && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Caption
                      </span>
                      <button
                        onClick={() => handleCopy(item.description, `${item.id}-desc`)}
                        className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-[#c83a2a] font-medium px-2 py-0.5 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Copy Caption"
                      >
                        {copiedId === `${item.id}-desc` ? (
                          <>
                            <FiCheck className="w-3 h-3 text-emerald-500" />
                            <span className="text-emerald-600 font-semibold">Copied</span>
                          </>
                        ) : (
                          <>
                            <FiCopy className="w-3 h-3" />
                            <span>Copy Caption</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-sm text-slate-800 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80 leading-relaxed whitespace-pre-wrap selection:bg-orange-100">
                      {item.description}
                    </p>
                  </div>
                )}

                {/* Script / AI Generation Prompt */}
                {item.script &&
                  item.script !== "No script" &&
                  item.script !== item.description && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          AI Image Prompt
                        </span>
                        <button
                          onClick={() => handleCopy(item.script, `${item.id}-script`)}
                          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-[#c83a2a] font-medium px-2 py-0.5 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Copy Prompt"
                        >
                          {copiedId === `${item.id}-script` ? (
                            <>
                              <FiCheck className="w-3.5 h-3.5 text-emerald-500" />
                              <span className="text-emerald-600 font-semibold">Copied</span>
                            </>
                          ) : (
                            <>
                              <FiCopy className="w-3.5 h-3.5" />
                              <span>Copy Prompt</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-xs font-mono text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 leading-relaxed">
                        {item.script}
                      </p>
                    </div>
                  )}

                {/* Tags / Hashtags */}
                {item.tags && (
                  <div className="space-y-1 pt-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                        <FiTag className="w-3 h-3 text-slate-400" /> Hashtags
                      </span>
                      <button
                        onClick={() =>
                          handleCopy(
                            item.tags
                              .split(",")
                              .map((t) => t.trim())
                              .filter(Boolean)
                              .join(" "),
                            `${item.id}-tags`
                          )
                        }
                        className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-[#c83a2a] font-medium px-2 py-0.5 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Copy Tags (Space-separated, no commas)"
                      >
                        {copiedId === `${item.id}-tags` ? (
                          <>
                            <FiCheck className="w-3 h-3 text-emerald-500" />
                            <span className="text-emerald-600 font-semibold">Copied</span>
                          </>
                        ) : (
                          <>
                            <FiCopy className="w-3 h-3" />
                            <span>Copy Tags</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {item.tags.split(",").map((tag: string, tIdx: number) => {
                        const trimmed = tag.trim();
                        if (!trimmed) return null;
                        const formatted = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
                        return (
                          <span
                            key={tIdx}
                            className="inline-flex items-center px-2.5 py-0.5 bg-orange-50 text-orange-900 border border-orange-200/80 rounded-full text-xs font-medium"
                          >
                            {formatted}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Reusable Pagination Component */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredItems.length}
            pageSize={PAGE_SIZE}
            onPageChange={(page) => {
              setCurrentPage(page);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </div>
      )}

      {/* Floating Toast Notification */}
      {copyNotification && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900 text-white text-sm font-semibold rounded-xl shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <FiCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{copyNotification}</span>
        </div>
      )}
    </div>
  );
}
