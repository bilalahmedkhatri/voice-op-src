"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiRefreshCw, FiAlertCircle } from "react-icons/fi";

import DetailHeader from "@/components/ContentDetail/DetailHeader";
import ScriptSection from "@/components/ContentDetail/ScriptSection";
import DescriptionSection from "@/components/ContentDetail/DescriptionSection";
import TagsSection from "@/components/ContentDetail/TagsSection";
import KeywordsSection from "@/components/ContentDetail/KeywordsSection";
import StatusSection from "@/components/ContentDetail/StatusSection";
import MediaVisualAssetsSection from "@/components/ContentDetail/MediaVisualAssetsSection";
import ExtractedMediaGallery from "@/components/ContentDetail/ExtractedMediaGallery";
import PreviewModal from "@/components/ContentDetail/PreviewModal";

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

  const handleSave = async () => {
    if (!item || !templateId) return;
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch(`/api/templates?id=${templateId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const templateData = data.template;
      const strategy = templateData.json_data.content_strategy;

      if (itemType === "long_video") {
        strategy.long_video = { ...strategy.long_video, ...item };
      } else {
        const shortIndex = strategy.shorts.findIndex((s: any) => s.id === item.id);
        if (shortIndex !== -1) {
          strategy.shorts[shortIndex] = { ...strategy.shorts[shortIndex], ...item };
        } else if (item.id.startsWith("short_")) {
          const idx = parseInt(item.id.split("_")[1]);
          if (strategy.shorts[idx]) {
            strategy.shorts[idx] = { ...strategy.shorts[idx], ...item };
          }
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
        throw new Error(patchData.error || "Failed to update");
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      setError("Failed to save changes: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!item || !templateId) return;
    const previousStatus = item.status;
    setItem({ ...item, status: newStatus });
    // Immediately save status
    await handleSave();
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
        image_type: 'video'
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
      setSignedMediaUrls([]);

      setTimeout(() => {
        setDownloadingItems(prev => ({ ...prev, ['keywords']: false }));
      }, 120000);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FiRefreshCw className="w-8 h-8 text-slate-400 animate-spin" />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="space-y-4 px-4 sm:px-0">
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 px-2 sm:px-4 md:px-6">

      <DetailHeader
        templateId={templateId}
        itemType={itemType}
        item={item}
        handleSendToVoice={handleSendToVoice}
        copiedId={copiedId}
        handleCopy={handleCopy}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Main Content Area (Left Column) */}
        <div className="lg:col-span-2 space-y-6">
          <DescriptionSection
            item={item}
            itemType={itemType}
            handleSendToVoice={handleSendToVoice}
            copiedId={copiedId}
            handleCopy={handleCopy}
          />

          <ScriptSection
            item={item}
            itemType={itemType}
            setItem={setItem}
            handleSendToVoice={handleSendToVoice}
            handleCopy={handleCopy}
            copiedId={copiedId}
            handleSave={handleSave}
            isSaving={isSaving}
            saveSuccess={saveSuccess}
          />
          
          <KeywordsSection
            keywordsList={keywordsList}
            copiedId={copiedId}
            handleCopy={handleCopy}
            rawKeywordsData={item.search_keywords || item.media_search_keywords || item.keywords}
            handleFetchByKeywords={handleFetchByKeywords}
            isDownloading={downloadingItems['keywords'] || false}
          />

          <MediaVisualAssetsSection
            extraDataMedia={extraData.media}
          />
        </div>

        {/* Sidebar Area (Right Column) */}
        <div className="space-y-6 lg:col-span-1">
          <TagsSection
            tagsList={tagsList}
            copiedId={copiedId}
            handleCopy={handleCopy}
            rawTagsData={item.tags}
          />

          <StatusSection
            item={item}
            itemType={itemType}
            handleStatusChange={handleStatusChange}
            isSaving={isSaving}
            saveSuccess={saveSuccess}
          />
        </div>
      </div>

      <ExtractedMediaGallery
        signedMediaUrls={signedMediaUrls}
        selectedMediaUrls={selectedMediaUrls}
        setSelectedMediaUrls={setSelectedMediaUrls}
        isDeleting={isDeleting}
        handleDeleteMedia={handleDeleteMedia}
        setPreviewMediaUrl={setPreviewMediaUrl}
        isDownloadingBulk={isDownloadingBulk}
        setIsDownloadingBulk={setIsDownloadingBulk}
        downloadProgress={downloadProgress}
        setDownloadProgress={setDownloadProgress}
      />

      <PreviewModal
        previewMediaUrl={previewMediaUrl}
        setPreviewMediaUrl={setPreviewMediaUrl}
      />

    </div>
  );
}
