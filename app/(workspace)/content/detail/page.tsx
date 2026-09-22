"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiRefreshCw, FiAlertCircle, FiVideo, FiYoutube, FiExternalLink, FiCopy, FiCheck, FiSave, FiMic, FiDownloadCloud, FiImage, FiSearch, FiTrash2, FiCheckSquare } from "react-icons/fi";

export default function ContentDetailPage() {
  const router = useRouter();
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [item, setItem] = useState<any>(null);
  const [itemType, setItemType] = useState<"short" | "long_video" | null>(null);
  const [extraData, setExtraData] = useState<{ media: any[], research: any[] }>({ media: [], research: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [downloadingItems, setDownloadingItems] = useState<{ [key: string]: boolean }>({});
  const [signedMediaUrls, setSignedMediaUrls] = useState<string[]>([]);
  const [selectedMediaUrls, setSelectedMediaUrls] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloadingBulk, setIsDownloadingBulk] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [previewMediaUrl, setPreviewMediaUrl] = useState<string | null>(null);

  const fetchDetail = async (tId: string, iId: string) => {
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
        // fallback if ids weren't perfectly assigned in db
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

      const media = [];
      const research = [];

      if (foundItem.media_links) media.push(foundItem.media_links);
      if (foundItem.visuals) media.push(foundItem.visuals);
      if (foundItem.research_sources) research.push(foundItem.research_sources);
      if (foundItem.references) research.push(foundItem.references);

      if (strategy.media_assets) media.push(strategy.media_assets);
      if (strategy.research_data) research.push(strategy.research_data);

      setExtraData({ media, research });

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendToVoice = (text: string, type?: string | null, title?: string) => {
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
    fetchDetail(tId, iId);
  }, []);

  // Poll for updates if any download is active
  useEffect(() => {
    let interval: any;
    const isDownloading = Object.values(downloadingItems).some(Boolean);
    if (isDownloading && templateId) {
      const params = new URLSearchParams(window.location.search);
      const iId = params.get("itemId");
      if (iId) {
        interval = setInterval(() => {
          fetchDetail(templateId, iId);
        }, 10000);
      }
    }
    return () => clearInterval(interval);
  }, [downloadingItems, templateId]);

  // Poll for signed media URLs when keyword search is active
  useEffect(() => {
    let interval: any;
    if (downloadingItems['keywords'] && item) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/media/poll?itemId=${item.id}`);
          if (res.ok) {
            const result = await res.json();
            const urls = result.data || result.urls || (Array.isArray(result) ? result : null);
            if (urls && Array.isArray(urls) && urls.length > 0) {
              setSignedMediaUrls(urls);
              setDownloadingItems(prev => ({ ...prev, ['keywords']: false }));
              clearInterval(interval);
            }
          }
        } catch (e) {
          console.error("Failed to poll media:", e);
        }
      }, 10000);
    }
    return () => clearInterval(interval);
  }, [downloadingItems['keywords'], item]);

  // Fetch existing signed media URLs on page load
  useEffect(() => {
    if (item?.id) {
      fetch(`/api/media/poll?itemId=${item.id}`)
        .then(res => res.json())
        .then(result => {
          const urls = result.data || result.urls || (Array.isArray(result) ? result : null);
          if (urls && Array.isArray(urls) && urls.length > 0) {
            setSignedMediaUrls(urls);
          }
        })
        .catch(e => console.error("Failed to load existing media:", e));
    }
  }, [item?.id]);

  const handleFetchByKeywords = async (keywords: { keyword: string, quantity_to_download?: number }[]) => {
    if (!templateId || !item || keywords.length === 0) return;
    setDownloadingItems(prev => ({ ...prev, ['keywords']: true }));

    try {
      const filters = {
        orientation: itemType === 'long_video' ? 'landscape' : 'portrait',
        image_type: 'video' // Enforce videos only
      };

      const res = await fetch(`/api/media/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_id: item.id,
          keywords,
          filters
        })
      });

      if (!res.ok) throw new Error("Failed to start keyword search");

      alert("Content generation started in the background!");
      setSignedMediaUrls([]); // Clear previous URLs on new fetch

      // We remove the static timeout because polling will stop it when data arrives
      // Fallback timeout just in case it hangs forever
      setTimeout(() => {
        setDownloadingItems(prev => ({ ...prev, ['keywords']: false }));
      }, 120000); // 2 minutes max wait

    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to start background search");
      setDownloadingItems(prev => ({ ...prev, ['keywords']: false }));
    }
  };

  const handleDeleteMedia = async (urlsToDelete: string[]) => {
    if (!item?.id || urlsToDelete.length === 0) return;

    if (!confirm(`Are you sure you want to delete ${urlsToDelete.length} media item(s)?`)) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/media/process`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_id: item.id,
          urls: urlsToDelete
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete media");
      }

      setSignedMediaUrls(prev => prev.filter(url => !urlsToDelete.includes(url)));
      setSelectedMediaUrls(prev => prev.filter(url => !urlsToDelete.includes(url)));

    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to delete media");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownloadSelected = async () => {
    if (selectedMediaUrls.length === 0) return;

    let dirHandle: any = null;
    
    // Try using the File System Access API (Supported in Chrome/Edge/Opera)
    if ('showDirectoryPicker' in window) {
      try {
        dirHandle = await (window as any).showDirectoryPicker({
          id: 'bulk-media-download',
          mode: 'readwrite'
        });
      } catch (err: any) {
        if (err.name === 'AbortError') {
          // User cancelled the directory picker dialog, stop the whole process
          return;
        }
        console.warn("Directory picker failed or blocked, falling back to traditional download:", err);
      }
    } else {
      alert("Your browser does not support selecting a folder. The videos will be saved to your default 'Downloads' folder.");
    }

    setIsDownloadingBulk(true);
    setDownloadProgress(0);

    let savedCount = 0;

    for (let i = 0; i < selectedMediaUrls.length; i++) {
      const url = selectedMediaUrls[i];
      try {
        // Fetch the file
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const blob = await response.blob();
        
        const isVideo = url.toLowerCase().includes('.mp4') || url.toLowerCase().includes('.webm');
        const ext = isVideo ? 'mp4' : 'jpg';
        const filename = `extracted_media_${i + 1}_${Date.now()}.${ext}`;
        
        if (dirHandle) {
          // Save directly to the chosen folder (No multiple browser prompts)
          const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
          const writable = await fileHandle.createWritable();
          await writable.write(blob);
          await writable.close();
          savedCount++;
        } else {
          // Fallback to traditional browser download (Goes to default Downloads folder)
          const blobUrl = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = blobUrl;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          
          // Delay revoking the object URL so the browser has time to start the download
          setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
          
          savedCount++;
          // Small delay for traditional method to prevent browser freezing
          await new Promise(res => setTimeout(res, 800));
        }
      } catch (err) {
        console.error(`Failed to download ${url}:`, err);
        // We do not alert on individual failures to avoid spamming, but we log them.
      }
      setDownloadProgress(i + 1);
    }
    
    setIsDownloadingBulk(false);
    
    // Show success alert
    if (savedCount > 0) {
      if (dirHandle) {
        setTimeout(() => alert(`Successfully saved ${savedCount} items directly to your selected folder!`), 300);
      } else {
        setTimeout(() => alert(`${savedCount} items have been downloaded to your default Downloads folder.`), 300);
      }
    } else {
      setTimeout(() => alert(`Failed to download items. This might be due to a CORS issue or network error. Please check the console for details.`), 300);
    }
  };

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
        <Link href={`/content?id=${templateId}`} className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline">
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

  const formatKeywords = (keywords: any): { keyword: string, quantity_to_download?: number }[] => {
    if (!Array.isArray(keywords)) {
      if (typeof keywords === 'string') {
        return keywords.split(',').map(k => ({ keyword: k.trim() })).filter(k => k.keyword);
      }
      return [];
    }
    const result: { keyword: string, quantity_to_download?: number }[] = [];
    keywords.forEach((k: any) => {
      if (typeof k === 'string') result.push({ keyword: k.trim() });
      else if (typeof k === 'object' && k.keyword) result.push({ keyword: k.keyword, quantity_to_download: k.quantity_to_download });
    });
    return result;
  };

  const tagsList = formatTags(item.tags);
  const keywordsList = formatKeywords(item.search_keywords || item.media_search_keywords || item.keywords);

  const renderValue = (val: any, keyPath: string): React.ReactNode => {
    if (typeof val === 'string' && val.match(/^https?:\/\//)) {
      return (
        <a href={val} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1 cursor-pointer break-all">
          {val} <FiExternalLink className="w-3 h-3 flex-shrink-0" />
        </a>
      );
    }
    if (val && typeof val === 'object' && !Array.isArray(val) && (val.source_url !== undefined || val.keyword !== undefined)) {
      return (
        <div className="p-3 bg-white border-t border-slate-200 flex-1 flex flex-col justify-between">
          <a href={val.source_url || '#'} target={val.source_url ? "_blank" : "_self"} rel="noopener noreferrer" className={`text-[11px] ${val.source_url ? 'text-blue-600 hover:underline' : 'text-slate-600 font-medium'} truncate w-full block mb-2`} title={val.source_url || val.keyword}>
            {val.source_url || `Search: ${val.keyword}` || 'Downloaded Media'}
          </a>
        </div>
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
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col space-y-2">
        <Link href={`/content?id=${templateId}`} className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline font-medium">
          <FiArrowLeft /> Back to Content Table
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
          {(item.script || item.description) && (
            <button
              onClick={() => handleSendToVoice(item.script || item.description, itemType, item.title)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm hover:shadow transition-all cursor-pointer"
            >
              <FiMic className="w-4 h-4" />
              <span>Generate Voiceover</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Description</h3>
              <div className="flex items-center gap-2">
                {item.description && !item.script && (
                  <button
                    onClick={() => handleSendToVoice(item.description, itemType, item.title)}
                    className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-xs font-semibold transition-colors cursor-pointer"
                    title="Send description to Voice Generator"
                  >
                    <FiMic className="w-3.5 h-3.5" />
                    <span>Voice</span>
                  </button>
                )}
                <button onClick={() => handleCopy(item.description, 'desc')} className="text-slate-400 hover:text-blue-600 transition-colors cursor-pointer p-1" title="Copy Description">
                  {copiedId === 'desc' ? <FiCheck className="w-4 h-4 text-green-500" /> : <FiCopy className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <p className="text-slate-700 whitespace-pre-wrap leading-relaxed text-sm">
              {item.description || <span className="italic text-slate-400">No description provided</span>}
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Full Script</h3>
              <div className="flex items-center gap-2">
                {item.script && (
                  <button
                    onClick={() => handleSendToVoice(item.script, itemType, item.title)}
                    className="flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                    title="Send script to AI Voice Generator"
                  >
                    <FiMic className="w-3.5 h-3.5" />
                    <span>Generate Voiceover</span>
                  </button>
                )}
                <button onClick={() => handleCopy(item.script, 'script')} className="text-slate-400 hover:text-blue-600 transition-colors cursor-pointer p-1" title="Copy Script">
                  {copiedId === 'script' ? <FiCheck className="w-4 h-4 text-green-500" /> : <FiCopy className="w-4 h-4" />}
                </button>
              </div>
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
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Search Keywords</h3>
              <button onClick={() => handleCopy(keywordsList.map(k => k.keyword).join(', '), 'keywords')} className="text-slate-400 hover:text-blue-600 transition-colors cursor-pointer p-1" title="Copy Keywords">
                {copiedId === 'keywords' ? <FiCheck className="w-4 h-4 text-green-500" /> : <FiCopy className="w-4 h-4" />}
              </button>
            </div>
            {keywordsList.length > 0 ? (
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-2">
                  {keywordsList.map((k, i: number) => (
                    <span key={i} className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1.5 rounded-full text-xs font-medium shadow-sm">
                      {k.keyword}
                      {k.quantity_to_download && (
                        <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                          {k.quantity_to_download}
                        </span>
                      )}
                    </span>
                  ))}
                </div>
                <div className="pt-2 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => handleFetchByKeywords(keywordsList)}
                    disabled={downloadingItems['keywords']}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-slate-400 disabled:to-slate-400 text-white rounded-lg text-sm font-semibold shadow-sm hover:shadow transition-all cursor-pointer"
                    title="Generate media from keywords"
                  >
                    {downloadingItems['keywords'] ? (
                      <FiRefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <FiSearch className="w-4 h-4" />
                    )}
                    <span>Generate Content</span>
                  </button>
                </div>
              </div>
            ) : (
              <p className="italic text-slate-400 text-sm">No search keywords provided</p>
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

      {item.downloaded_media && Array.isArray(item.downloaded_media) && item.downloaded_media.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <FiImage className="w-5 h-5 text-slate-600" />
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Downloaded Media</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {item.downloaded_media.map((media: any, idx: number) => (
              <div key={idx} className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50 shadow-sm flex flex-col group">
                <div className="relative w-full aspect-video bg-black/5 flex items-center justify-center overflow-hidden">
                  {media.base64_data ? (
                    <img
                      src={media.base64_data.startsWith('data:') ? media.base64_data : `data:image/jpeg;base64,${media.base64_data}`}
                      alt="Downloaded media"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <span className="text-slate-400 text-xs font-medium">No Image Data</span>
                  )}
                </div>
                <div className="p-3 bg-white border-t border-slate-200 flex-1 flex flex-col justify-between">
                  <a href={media.source_url || '#'} target={media.source_url ? "_blank" : "_self"} rel="noopener noreferrer" className="text-[11px] text-blue-600 hover:underline truncate w-full block mb-2" title={media.source_url || media.keyword}>
                    {media.source_url || `Search: ${media.keyword}` || 'Downloaded Media'}
                  </a>
                  <button
                    onClick={() => {
                      const a = document.createElement("a");
                      a.href = media.base64_data.startsWith('data:') ? media.base64_data : `data:image/jpeg;base64,${media.base64_data}`;
                      a.download = `media_${idx}.jpg`;
                      a.click();
                    }}
                    className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded transition-colors"
                  >
                    Save to Device
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Extracted Media from Background Generator (Full width gallery) */}
      {signedMediaUrls.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <FiImage className="w-5 h-5 text-slate-600" />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Extracted Media Gallery</h3>
            </div>
            <div className="flex items-center gap-3">
              <select
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "") return;
                  if (val === "clear") {
                    setSelectedMediaUrls([]);
                  } else if (val === "all") {
                    setSelectedMediaUrls([...signedMediaUrls]);
                  } else {
                    const count = parseInt(val, 10);
                    setSelectedMediaUrls(signedMediaUrls.slice(0, count));
                  }
                  e.target.value = ""; // Reset dropdown after selection
                }}
                className="text-xs font-medium border border-slate-200 rounded-md px-2 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm bg-white"
                defaultValue=""
              >
                <option value="" disabled>Select Multiple...</option>
                <option value="10">Select First 10</option>
                <option value="20">Select First 20</option>
                <option value="30">Select First 30</option>
                <option value="all">Select All</option>
                <option value="clear">Clear Selection</option>
              </select>

              {selectedMediaUrls.length > 0 && (
                <>
                  <button
                    onClick={handleDownloadSelected}
                    disabled={isDownloadingBulk || isDeleting}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 text-blue-600 rounded-md text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                  >
                    {isDownloadingBulk ? <FiRefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FiDownloadCloud className="w-3.5 h-3.5" />}
                    <span>{isDownloadingBulk ? `Downloading ${downloadProgress}/${selectedMediaUrls.length}...` : `Download Selected (${selectedMediaUrls.length})`}</span>
                  </button>
                  <button
                    onClick={() => handleDeleteMedia(selectedMediaUrls)}
                    disabled={isDeleting || isDownloadingBulk}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-600 rounded-md text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                  >
                    {isDeleting ? <FiRefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FiTrash2 className="w-3.5 h-3.5" />}
                    <span>{isDeleting ? 'Deleting...' : `Delete Selected (${selectedMediaUrls.length})`}</span>
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 p-3">
            {signedMediaUrls.map((url, idx) => {
              const isVideo = url.toLowerCase().includes('.mp4') || url.toLowerCase().includes('.webm');
              const isSelected = selectedMediaUrls.includes(url);
              return (
                <div
                  key={idx}
                  className={`relative w-full break-inside-avoid mb-3 rounded-md overflow-hidden border ${isSelected ? 'border-blue-500 border-2' : 'border-slate-200/50 bg-slate-50'} group cursor-pointer`}
                  onClick={() => setPreviewMediaUrl(url)}
                >
                  {isVideo ? (
                    <>
                      <video 
                        src={url} 
                        controls 
                        controlsList="nodownload" 
                        className="w-full h-auto block" 
                      />
                      {/* Invisible overlay to capture clicks for the popup */}
                      <div className="absolute inset-0 z-[5] bg-transparent" />
                      <div className="absolute top-2 right-2 bg-black/50 p-1 rounded backdrop-blur-sm z-10 pointer-events-none">
                        <FiVideo className="w-3 h-3 text-white" />
                      </div>
                    </>
                  ) : (
                    <img src={url} alt={`Media ${idx}`} className="w-full h-auto block transition-transform duration-300 group-hover:scale-105 pointer-events-none" />
                  )}

                  {/* Selection Checkbox */}
                  <div
                    className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedMediaUrls(prev => [...prev, url]);
                        else setSelectedMediaUrls(prev => prev.filter(u => u !== url));
                      }}
                      className="w-4 h-4 cursor-pointer accent-blue-600"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {renderDataSection("Research Sources & References", extraData.research)}

      {/* Media Preview Modal */}
      {previewMediaUrl && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-white/70 p-4 sm:p-8 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setPreviewMediaUrl(null)}
        >
          <div
            className="relative w-full max-w-5xl bg-white rounded-xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col transform transition-all duration-300 scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="text-slate-700 text-sm font-semibold flex items-center gap-2">
                  <FiVideo className="w-4 h-4 text-blue-600" /> Media Preview
                </span>
              </div>
              <div className="flex items-center gap-4">
                <a 
                  href={previewMediaUrl} 
                  download 
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Download File"
                >
                  <FiDownloadCloud className="w-4 h-4" />
                </a>
                <button
                  className="text-slate-400 hover:text-red-400 transition-colors"
                  onClick={() => setPreviewMediaUrl(null)}
                  title="Close (Esc)"
                >
                  <span className="text-2xl leading-none">&times;</span>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex items-center justify-center w-full bg-black min-h-[40vh] max-h-[85vh] p-1 sm:p-2">
              {(previewMediaUrl.toLowerCase().includes('.mp4') || previewMediaUrl.toLowerCase().includes('.webm')) ? (
                <video
                  src={previewMediaUrl}
                  controls
                  autoPlay
                  controlsList="nodownload"
                  className="max-w-full max-h-[80vh] object-contain rounded-md"
                />
              ) : (
                <img
                  src={previewMediaUrl}
                  alt="Preview"
                  className="max-w-full max-h-[80vh] object-contain rounded-md"
                />
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
