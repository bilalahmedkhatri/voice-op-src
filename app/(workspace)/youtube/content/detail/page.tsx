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
import ConfirmModal from "@/components/ui/ConfirmModal";
import AudioPlayer from "@/app/components/AudioPlayer";
import { Button } from "@/components/ui";

export default function YouTubeContentDetailPage() {
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

  const [mediaToDelete, setMediaToDelete] = useState<string[]>([]);
  const [previewMediaUrl, setPreviewMediaUrl] = useState<string | null>(null);
  const [selectedAudioIndex, setSelectedAudioIndex] = useState(0);

  const fetchDetail = async (tId: string, iId: string) => {
    try {
      const res = await fetch(`/api/templates?id=${tId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch template");

      const strategy = data.template.json_data?.content_strategy;
      if (!strategy) throw new Error("No YouTube content strategy found in this template");

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

      // Extract audio_urls from template
      if (data.template.audio_urls && Array.isArray(data.template.audio_urls)) {
        const matchingAudios = data.template.audio_urls.filter((a: any) => a.audio_id === iId);
        
        // Sort newest first
        matchingAudios.sort((a: any, b: any) => {
          const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return timeB - timeA;
        });

        foundItem.audio_list = matchingAudios;

        for (const audio of matchingAudios) {
          if (!audio.audio_url && audio.job_id) {
            try {
              const statusRes = await fetch(`/api/templates/audio-job/status?jobId=${audio.job_id}`);
              if (statusRes.ok) {
                const statusData = await statusRes.json();
                if ((statusData.status === 'completed' || statusData.status === 'success') && statusData.audio_url) {
                  audio.audio_url = statusData.audio_url;
                  fetch('/api/templates/audio-job', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      templateId: tId,
                      itemId: iId,
                      jobId: audio.job_id,
                      audioUrl: statusData.audio_url,
                      voiceName: audio.voice_name || statusData.voice_name,
                      voiceId: audio.voice_id || statusData.voice_id,
                      modelId: audio.model_id || statusData.model_id,
                      createdAt: audio.created_at || new Date().toISOString(),
                    })
                  }).catch(e => console.error('Failed to save audio_url to db:', e));
                }
              }
            } catch (e) {
              console.error("Failed to check audio job status:", e);
            }
          }
        }

        if (matchingAudios.length > 0) {
          const activeAudio = matchingAudios[0];
          if (activeAudio.job_id) foundItem.job_id = activeAudio.job_id;
          if (activeAudio.audio_url) foundItem.audio_url = activeAudio.audio_url;
        }
      }

      setItem(foundItem);
      setItemType(foundType);

      const media = [];
      const research = [];

      if (foundItem.media_links) media.push(foundItem.media_links);
      if (foundItem.visuals) media.push(foundItem.visuals);
      if (foundItem.research_sources) research.push(foundItem.research_sources);
      if (foundItem.references) research.push(foundItem.references);

      if (strategy?.media_assets) media.push(strategy.media_assets);
      if (strategy?.research_data) research.push(strategy.research_data);

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
      if (templateId) {
        localStorage.setItem("pending_voice_template_id", templateId);
      }
      if (item?.id) {
        localStorage.setItem("pending_voice_item_id", item.id);
      }
    }
    router.push("/admin?from=youtube");
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
    setItem({ ...item, status: newStatus });
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
          const pollParams = new URLSearchParams({ itemId: item.id });
          if (templateId) pollParams.set('templateId', templateId);
          const res = await fetch(`/api/media/poll?${pollParams.toString()}`);
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
      const pollParams = new URLSearchParams({ itemId: item.id });
      if (templateId) pollParams.set('templateId', templateId);
      fetch(`/api/media/poll?${pollParams.toString()}`)
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
          template_id: templateId,
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

  const handleDeleteMedia = (urlsToDelete: string[]) => {
    if (!item?.id || urlsToDelete.length === 0) return;
    setMediaToDelete(urlsToDelete);
  };

  const confirmDeleteMedia = async () => {
    if (!item?.id || mediaToDelete.length === 0) return;

    const urlsToDelete = mediaToDelete;
    setMediaToDelete([]);
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
        <Link href={`/youtube/content?id=${templateId}`} className="inline-flex items-center gap-2 text-sm text-red-600 hover:underline">
          <FiArrowLeft /> Back to YouTube Strategy
        </Link>
        <h1 className="text-xl font-bold text-slate-900">
          YouTube Content Strategy Detail
        </h1>
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
    <div className="space-y-6 mx-auto pb-12 sm:px-4">
      <DetailHeader
        templateId={templateId}
        backUrl={`/youtube/content?id=${templateId}`}
        backText="Back to YouTube Strategy"
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

          {item?.audio_list && item.audio_list.length > 0 ? (
            <div className="mt-6 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <span>Generated Voiceovers</span>
                  <span className="px-1.5 py-0.5 bg-orange-100 text-[#c83a2a] rounded-full text-[10px] font-bold">
                    {item.audio_list.length}
                  </span>
                </h3>
              </div>

              {/* Multiple Voice Selection Chips */}
              {item.audio_list.length > 1 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-thin">
                  {item.audio_list.map((aud: any, idx: number) => {
                    const isSelected = selectedAudioIndex === idx;
                    const label = aud.voice_name || aud.voice_id || `Voice ${idx + 1}`;
                    return (
                      <Button
                        key={aud.job_id || idx}
                        onClick={() => setSelectedAudioIndex(idx)}
                        variant={isSelected ? "primary" : "secondary"}
                        size="sm"
                        className="flex-shrink-0"
                      >
                        <span className="flex items-center gap-1.5">
                          <span>🔊 {label}</span>
                          {aud.created_at && (
                            <span className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                              {new Date(aud.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </span>
                      </Button>
                    );
                  })}
                </div>
              )}

              {/* Active Voice AudioPlayer */}
              {(() => {
                const currentAudio = item.audio_list[selectedAudioIndex] || item.audio_list[0];
                return (
                  <AudioPlayer
                    key={currentAudio?.job_id || selectedAudioIndex}
                    audioUrl={currentAudio?.audio_url || item.voiceover_url}
                    jobId={currentAudio?.job_id}
                    onAudioUrlRenewed={(newUrl) => {
                      setItem((prev: any) => {
                        if (!prev || !prev.audio_list) return prev;
                        const updatedList = [...prev.audio_list];
                        if (updatedList[selectedAudioIndex]) {
                          updatedList[selectedAudioIndex] = { ...updatedList[selectedAudioIndex], audio_url: newUrl };
                        }
                        return { ...prev, audio_list: updatedList, audio_url: newUrl };
                      });
                      if (templateId && item?.id) {
                        fetch('/api/templates/audio-job', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            templateId,
                            itemId: item.id,
                            jobId: currentAudio?.job_id,
                            audioUrl: newUrl,
                          }),
                        }).catch((err) => console.error('Failed to sync renewed audio URL to DB:', err));
                      }
                    }}
                    videoFormat={itemType === 'long_video' ? 'long' : 'short'}
                    fileName={`${currentAudio?.voice_name ? `${currentAudio.voice_name}_` : ''}${item.title || item.id || 'voiceover'}.wav`}
                  />
                );
              })()}
            </div>
          ) : (item?.audio_url || item?.voiceover_url || item?.job_id) ? (
            <div className="mt-6">
              <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider">Generated Voiceover</h3>
              <AudioPlayer
                audioUrl={item.audio_url || item.voiceover_url}
                jobId={item.job_id}
                onAudioUrlRenewed={(newUrl) => {
                  setItem((prev: any) => (prev ? { ...prev, audio_url: newUrl } : prev));
                  if (templateId && item?.id) {
                    fetch('/api/templates/audio-job', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        templateId,
                        itemId: item.id,
                        jobId: item.job_id,
                        audioUrl: newUrl,
                      }),
                    }).catch((err) => console.error('Failed to sync renewed audio URL to DB:', err));
                  }
                }}
                videoFormat={itemType === 'long_video' ? 'long' : 'short'}
                fileName={`${item.title || item.id || 'voiceover'}.wav`}
              />
            </div>
          ) : null}
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

      <ConfirmModal
        isOpen={mediaToDelete.length > 0}
        onClose={() => setMediaToDelete([])}
        onConfirm={confirmDeleteMedia}
        title="Delete Media"
        message={`Are you sure you want to delete ${mediaToDelete.length} media item(s)?`}
      />
    </div>
  );
}
