"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { FiArrowLeft, FiRefreshCw, FiAlertCircle, FiVideo, FiYoutube, FiExternalLink, FiCopy, FiCheck, FiSave } from "react-icons/fi";

export default function ContentDetailPage() {
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [item, setItem] = useState<any>(null);
  const [itemType, setItemType] = useState<"short" | "long_video" | null>(null);
  const [extraData, setExtraData] = useState<{ media: any[], research: any[] }>({ media: [], research: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleCopy = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!item || !templateId) return;
    const previousStatus = item.status;
    setItem({ ...item, status: newStatus });
    
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch(`/api/templates?id=${templateId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      const templateData = data.template;
      const strategy = templateData.json_data.content_strategy;

      if (itemType === "long_video") {
        strategy.long_video.status = newStatus;
      } else {
        const shortIndex = strategy.shorts.findIndex((s: any) => s.id === item.id);
        if (shortIndex !== -1) {
          strategy.shorts[shortIndex].status = newStatus;
        } else if (item.id.startsWith("short_")) {
          const idx = parseInt(item.id.split("_")[1]);
          if (strategy.shorts[idx]) strategy.shorts[idx].status = newStatus;
        }
      }

      const patchRes = await fetch("/api/templates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: templateId,
          status: templateData.status,
          json_data: templateData.json_data,
        }),
      });

      if (!patchRes.ok) {
        const patchData = await patchRes.json();
        throw new Error(patchData.error || "Failed to update status");
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      setItem({ ...item, status: previousStatus });
      setError("Failed to update status: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tId = params.get("templateId");
    const iId = params.get("itemId");
    
    if (!tId || !iId) {
      setError("Missing templateId or itemId in URL");
      setIsLoading(false);
      return;
    }
    
    setTemplateId(tId);

    const fetchDetail = async () => {
      try {
        const res = await fetch(`/api/templates?id=${tId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch template");
        
        const strategy = data.template.json_data?.content_strategy;
        if (!strategy) throw new Error("No content strategy found");

        let foundItem = null;
        let foundType: "short" | "long_video" | null = null;

        if (strategy.long_video && strategy.long_video.id === iId) {
          foundItem = strategy.long_video;
          foundType = "long_video";
        } else if (Array.isArray(strategy.shorts)) {
          foundItem = strategy.shorts.find((s: any) => s.id === iId);
          if (foundItem) foundType = "short";
        }

        if (!foundItem) {
          // fallback if ids weren't perfectly assigned in db, try to match by index if format is short_0
          if (iId.startsWith("short_")) {
            const idx = parseInt(iId.split("_")[1]);
            if (strategy.shorts && strategy.shorts[idx]) {
              foundItem = strategy.shorts[idx];
              foundType = "short";
            }
          } else if (iId === "long_1" && strategy.long_video) {
            foundItem = strategy.long_video;
            foundType = "long_video";
          }
        }

        if (!foundItem) throw new Error("Content item not found");

        setItem(foundItem);
        setItemType(foundType);

        // Try to extract media links and research sources broadly
        const media = [];
        const research = [];

        // Check inside the specific item first
        if (foundItem.media_links) media.push(foundItem.media_links);
        if (foundItem.visuals) media.push(foundItem.visuals);
        if (foundItem.research_sources) research.push(foundItem.research_sources);
        if (foundItem.references) research.push(foundItem.references);

        // Also check the global strategy level
        if (strategy.media_assets) media.push(strategy.media_assets);
        if (strategy.research_data) research.push(strategy.research_data);

        setExtraData({ media, research });

      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetail();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FiRefreshCw className="w-8 h-8 text-slate-400 animate-spin" />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="space-y-4">
        <Link href={`/dashboard/content?id=${templateId}`} className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline">
          <FiArrowLeft /> Back to Content Table
        </Link>
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-lg border border-red-200">
          <FiAlertCircle className="w-5 h-5" />
          <p>{error || "Item not found"}</p>
        </div>
      </div>
    );
  }

  const formatTags = (tags: any) => {
    if (!Array.isArray(tags)) return [];
    return tags.map((t: string) => {
      const trimmed = t.trim();
      return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
    });
  };

  const tagsList = formatTags(item.tags);

  const renderValue = (val: any, keyPath: string): React.ReactNode => {
    if (typeof val === 'string' && val.match(/^https?:\/\//)) {
      return (
        <a href={val} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1 cursor-pointer">
          {val} <FiExternalLink className="w-3 h-3 flex-shrink-0" />
        </a>
      );
    }
    if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
      return <span>{String(val)}</span>;
    }
    if (Array.isArray(val)) {
      return (
        <ul className="list-disc pl-5 space-y-1 mt-1">
          {val.map((item, idx) => (
            <li key={`${keyPath}-${idx}`}>{renderValue(item, `${keyPath}-${idx}`)}</li>
          ))}
        </ul>
      );
    }
    if (typeof val === 'object' && val !== null) {
      return (
        <div className="pl-4 border-l-2 border-slate-200 mt-1 space-y-2">
          {Object.entries(val).map(([k, v]) => (
            <div key={`${keyPath}-${k}`}>
              <span className="font-semibold text-slate-700 capitalize">{k.replace(/_/g, ' ')}:</span> {renderValue(v, `${keyPath}-${k}`)}
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderDataSection = (title: string, dataArray: any[]) => {
    if (!dataArray || dataArray.length === 0 || dataArray.every(d => !d)) return null;
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">{title}</h3>
        <div className="bg-slate-50 p-5 rounded-lg border border-slate-100 max-h-96 overflow-y-auto text-sm text-slate-700">
          {dataArray.map((data, idx) => (
             <div key={idx} className="mb-4 last:mb-0">
               {renderValue(data, `${title}-${idx}`)}
             </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex flex-col space-y-2">
        <Link href={`/dashboard/content?id=${templateId}`} className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline font-medium">
          <FiArrowLeft /> Back to Content Table
        </Link>
        <div className="flex items-center gap-3">
          {itemType === "long_video" ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-800 border border-purple-200 rounded-lg text-sm font-bold shadow-sm">
              <FiYoutube className="w-4 h-4" /> Long Video
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-800 border border-red-200 rounded-lg text-sm font-bold shadow-sm">
              <FiVideo className="w-4 h-4" /> Short Video
            </span>
          )}
          <h1 className="text-2xl font-bold text-slate-900 line-clamp-1 flex-1">
            {item.title || "Untitled Video"}
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Description</h3>
              <button onClick={() => handleCopy(item.description, 'desc')} className="text-slate-400 hover:text-blue-600 transition-colors cursor-pointer p-1" title="Copy Description">
                {copiedId === 'desc' ? <FiCheck className="w-4 h-4 text-green-500" /> : <FiCopy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-slate-700 whitespace-pre-wrap leading-relaxed text-sm">
              {item.description || <span className="italic text-slate-400">No description provided</span>}
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Full Script</h3>
              <button onClick={() => handleCopy(item.script, 'script')} className="text-slate-400 hover:text-blue-600 transition-colors cursor-pointer p-1" title="Copy Script">
                {copiedId === 'script' ? <FiCheck className="w-4 h-4 text-green-500" /> : <FiCopy className="w-4 h-4" />}
              </button>
            </div>
            <div className="bg-amber-50/50 p-5 rounded-lg border border-amber-100/50">
              <p className="text-slate-800 whitespace-pre-wrap leading-relaxed font-serif text-[15px]">
                {item.script || <span className="italic text-slate-400 font-sans">No script provided</span>}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Tags</h3>
              <button onClick={() => handleCopy(item.tags, 'tags')} className="text-slate-400 hover:text-blue-600 transition-colors cursor-pointer p-1" title="Copy Tags">
                {copiedId === 'tags' ? <FiCheck className="w-4 h-4 text-green-500" /> : <FiCopy className="w-4 h-4" />}
              </button>
            </div>
            {tagsList.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {tagsList.map((t: string, i: number) => (
                  <span key={i} className="inline-block bg-slate-100 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-full text-xs font-medium shadow-sm">
                    {t}
                  </span>
                ))}
              </div>
            ) : (
              <p className="italic text-slate-400 text-sm">No tags provided</p>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">Status</h3>
            <div className="flex flex-col gap-3">
              <select
                value={item.status || "pending"}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={isSaving}
                className={`text-sm font-medium border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full cursor-pointer shadow-sm disabled:opacity-50 ${itemType === 'short' ? 'bg-red-50' : 'bg-purple-50'}`}
              >
                <option value="pending">Pending</option>
                <option value="draft">Draft</option>
                <option value="completed">Completed</option>
                <option value="published">Published</option>
              </select>
              {isSaving && <span className="text-xs text-blue-600 flex items-center gap-1"><FiRefreshCw className="w-3 h-3 animate-spin" /> Updating status...</span>}
              {saveSuccess && <span className="text-xs text-green-600 flex items-center gap-1"><FiCheck className="w-3 h-3" /> Status updated!</span>}
            </div>
          </div>
        </div>
      </div>

      {renderDataSection("Media & Visual Assets", extraData.media)}
      {renderDataSection("Research Sources & References", extraData.research)}

    </div>
  );
}
