'use client';

import { useState, useEffect, useRef, memo } from 'react';
import {
  FaHistory,
  FaPlay,
  FaPause,
  FaDownload,
  FaTrash,
  FaBolt,
  FaGoogle,
  FaVolumeUp,
} from 'react-icons/fa';
import { isDatabaseEnabled } from '../lib/config';
import {
  getLocalHistoryItems,
  deleteLocalHistoryItem,
  clearAllLocalHistory,
  LocalHistoryItem,
} from '../lib/localHistoryStorage';
import { generateVoiceoverFilename } from '../lib/filenameUtils';
import ConfirmModal from '@/components/ui/ConfirmModal';

interface UnifiedHistoryItem {
  id: string;
  prompt_text: string;
  model_id: string;
  model_name: string;
  voice_id: string;
  voice_name: string;
  audio_url?: string;
  audioBlob?: Blob;
  duration_sec?: number | null;
  generation_time_sec?: number | null;
  video_format?: 'short' | 'long' | string;
  parameters?: Record<string, any>;
  created_at: string;
}

interface GenerationHistoryProps {
  onLoadPrompt?: (text: string) => void;
  onHistoryCountChange?: (count: number) => void;
  refreshTrigger?: number;
}

const GenerationHistory = memo(function GenerationHistory({
  onLoadPrompt,
  onHistoryCountChange,
  refreshTrigger = 0,
}: GenerationHistoryProps) {
  const [historyItems, setHistoryItems] = useState<UnifiedHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlsRef = useRef<Record<string, string>>({});

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(blobUrlsRef.current).forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch { }
      });
    };
  }, []);

  useEffect(() => {
    const dbEnabled = isDatabaseEnabled();
    setIsOfflineMode(!dbEnabled);

    if (!dbEnabled) {
      loadOfflineHistory();
    } else {
      loadOnlineHistory();
    }
  }, [refreshTrigger]);

  // Safely synchronize history count to parent without setState-in-render violations
  useEffect(() => {
    onHistoryCountChange?.(historyItems.length);
  }, [historyItems.length, onHistoryCountChange]);

  const loadOfflineHistory = async () => {
    try {
      setLoading(true);
      const localItems = await getLocalHistoryItems();
      const unified: UnifiedHistoryItem[] = localItems.map((item) => {
        let url = item.audio_url;
        if (!url && item.audioBlob) {
          if (!blobUrlsRef.current[item.id]) {
            blobUrlsRef.current[item.id] = URL.createObjectURL(item.audioBlob);
          }
          url = blobUrlsRef.current[item.id];
        }
        return {
          ...item,
          audio_url: url,
        };
      });

      setHistoryItems(unified);
    } catch (e) {
      console.error('Error loading offline local history:', e);
      setHistoryItems([]);
    } finally {
      setLoading(false);
    }
  };

  const loadOnlineHistory = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/history');
      const data = await res.json();
      if (data.authenticated) {
        setAuthenticated(true);
        const items = data.items || [];
        setHistoryItems(items);
      } else {
        setAuthenticated(false);
        // Fallback to local storage if user not signed in online
        const localItems = await getLocalHistoryItems();
        const unified: UnifiedHistoryItem[] = localItems.map((item) => {
          let url = item.audio_url;
          if (!url && item.audioBlob) {
            if (!blobUrlsRef.current[item.id]) {
              blobUrlsRef.current[item.id] = URL.createObjectURL(item.audioBlob);
            }
            url = blobUrlsRef.current[item.id];
          }
          return {
            ...item,
            audio_url: url,
          };
        });
        setHistoryItems(unified);
      }
    } catch (e) {
      console.error('Error loading online history:', e);
      setHistoryItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayToggle = (item: UnifiedHistoryItem) => {
    const src = item.audio_url || (item.audioBlob ? URL.createObjectURL(item.audioBlob) : null);
    if (!src) return;

    if (playingId === item.id && audioRef.current) {
      audioRef.current.pause();
      setPlayingId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(src);
    audioRef.current = audio;
    setPlayingId(item.id);

    audio.play().catch(() => setPlayingId(null));
    audio.onended = () => setPlayingId(null);
    audio.onerror = () => setPlayingId(null);
  };

  const handleDeleteItem = async (id: string) => {
    try {
      setDeletingId(id);
      if (isOfflineMode || !authenticated) {
        await deleteLocalHistoryItem(id);
      } else {
        await fetch(`/api/history?id=${id}`, { method: 'DELETE' });
      }

      setHistoryItems((prev) => prev.filter((it) => it.id !== id));
    } catch (e) {
      console.error('Failed to delete history item:', e);
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearAll = async () => {
    setShowClearAllModal(false);
    try {
      if (isOfflineMode || !authenticated) {
        await clearAllLocalHistory();
      } else {
        await fetch('/api/history?clear_all=true', { method: 'DELETE' });
      }

      setHistoryItems([]);
    } catch (e) {
      console.error('Failed to clear history:', e);
    }
  };

  const formatRelativeTime = (timestamp: string) => {
    try {
      const diff = Date.now() - new Date(timestamp).getTime();
      const mins = Math.floor(diff / (1000 * 60));
      if (mins < 1) return 'Just now';
      if (mins < 60) return `${mins}m ago`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    } catch {
      return '';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-3 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-gray-100/80 animate-pulse rounded-2xl" />
        ))}
      </div>
    );
  }

  // If online mode but guest with no history
  if (!isOfflineMode && !authenticated && historyItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 sm:p-8 text-center bg-slate-50/60 rounded-2xl border border-slate-200/80">
        <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#ff7d6e] flex items-center justify-center mb-3">
          <FaHistory className="text-xl" />
        </div>
        <h4 className="text-sm font-bold text-slate-900 mb-1">
          Sign In to Sync History
        </h4>
        <p className="text-xs text-slate-500 max-w-xs mb-4">
          Save your generated voiceovers in the cloud, reuse prompts, and access them across all devices.
        </p>
        <a
          href="/api/auth/google"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white text-slate-800 border border-slate-200 hover:border-[#ff9b8f]/60 hover:bg-orange-50/50 shadow-2xs transition-all cursor-pointer"
        >
          <FaGoogle className="text-red-500" />
          <span>Sign In with Google</span>
        </a>
      </div>
    );
  }

  if (historyItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-50/60 rounded-2xl border border-slate-200/80">
        <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#ff7d6e] flex items-center justify-center mb-3">
          <FaVolumeUp className="text-xl" />
        </div>
        <h4 className="text-sm font-bold text-slate-900 mb-1">
          No Voiceovers in History Yet
        </h4>
        <p className="text-xs text-slate-500 max-w-xs">
          Generate your first speech audio on the left and it will automatically appear here with playback and download options.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* History Header & Clear Action */}
      <div className="flex items-center justify-between px-1 pb-1 border-b border-slate-100">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            {historyItems.length} Saved Voiceover{historyItems.length !== 1 ? 's' : ''}
          </span>
          {isOfflineMode && (
            <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Offline IndexedDB
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowClearAllModal(true)}
          className="text-[11px] font-semibold text-rose-500 hover:text-rose-700 hover:underline cursor-pointer"
        >
          Clear All
        </button>
      </div>

      {/* History List */}
      <div className="flex flex-col gap-2.5 max-h-[480px] overflow-y-auto pr-1">
        {historyItems.map((item) => {
          const isPlaying = playingId === item.id;
          return (
            <div
              key={item.id}
              className="p-3.5 bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 shadow-2xs hover:shadow-xs transition-all flex flex-col gap-2.5"
            >
              {/* Top Row: Meta Tags & Actions */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Video format tag (Short vs Long) */}
                  {(() => {
                    const fmt = item.video_format || item.parameters?.video_format;
                    if (!fmt) return null;
                    const isShort = fmt === 'short';
                    return (
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                          isShort
                            ? 'bg-rose-50 text-rose-700 border-rose-200/80'
                            : 'bg-amber-50 text-amber-900 border-amber-200/80'
                        }`}
                      >
                        {isShort ? '⚡ Short' : '🎬 Long'}
                      </span>
                    );
                  })()}

                  <span className="px-2 py-0.5 bg-orange-50 text-orange-950 border border-orange-200/80 rounded-lg text-[10px] font-bold">
                    {item.voice_name}
                  </span>
                  <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium">
                    {item.model_name}
                  </span>
                  {item.generation_time_sec && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-bold border border-emerald-200/60">
                      <FaBolt className="text-[8px]" />
                      <span>{item.generation_time_sec}s</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <span>{formatRelativeTime(item.created_at)}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(item.id)}
                    disabled={deletingId === item.id}
                    title="Delete item"
                    className="text-slate-400 hover:text-rose-500 transition-colors p-1 cursor-pointer"
                  >
                    <FaTrash className="text-[10px]" />
                  </button>
                </div>
              </div>

              {/* Generation Parameters Tags (Speed + Model Specific Options) */}
              {(() => {
                const paramsMap: Record<string, any> = { ...(item.parameters || {}) };
                if (paramsMap.speed === undefined && paramsMap.rate === undefined) {
                  paramsMap.speed = 1.0;
                }
                const paramEntries = Object.entries(paramsMap).filter(
                  ([_, val]) => val !== undefined && val !== null && val !== ''
                );

                if (paramEntries.length === 0) return null;

                return (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {paramEntries.map(([key, val]) => {
                      const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
                      const formattedVal =
                        typeof val === 'number' && (key === 'speed' || key === 'rate')
                          ? `${val}x`
                          : String(val);
                      return (
                        <span
                          key={key}
                          className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-50 text-slate-600 border border-slate-200/60"
                        >
                          {label}: <strong className="text-slate-800 font-semibold">{formattedVal}</strong>
                        </span>
                      );
                    })}
                  </div>
                );
              })()}

              {/* Short Prompt Snippet */}
              <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-serif text-xs">&ldquo;</span>
                <span className="truncate font-normal text-slate-700">
                  {item.prompt_text.length > 70
                    ? `${item.prompt_text.substring(0, 70).trim()}...`
                    : item.prompt_text}
                </span>
                <span className="text-slate-400 font-serif text-xs">&rdquo;</span>
              </div>

              {/* Bottom Actions Row */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handlePlayToggle(item)}
                  className={`h-9 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
                    isPlaying
                      ? 'bg-amber-500 hover:bg-amber-600 text-white'
                      : 'bg-[#ff7d6e] hover:bg-[#e04836] text-white'
                  }`}
                >
                  {isPlaying ? (
                    <>
                      <FaPause className="text-[10px]" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <FaPlay className="text-[10px] ml-0.5" />
                      <span>Play</span>
                    </>
                  )}
                </button>

                {item.audio_url && (
                  <a
                    href={item.audio_url}
                    download={generateVoiceoverFilename({
                      videoFormat: item.video_format || item.parameters?.video_format,
                      voiceName: item.voice_name,
                      parameters: item.parameters,
                      date: item.created_at,
                    })}
                    className="h-9 px-3.5 rounded-xl text-xs font-semibold bg-white hover:bg-orange-50/50 text-slate-700 border border-slate-200 hover:border-[#ff9b8f]/60 flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                    title="Download audio"
                  >
                    <FaDownload className="text-[10px] text-slate-500" />
                    <span>Download</span>
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      <ConfirmModal 
        isOpen={showClearAllModal} 
        onClose={() => setShowClearAllModal(false)} 
        onConfirm={handleClearAll}
        title="Clear All History"
        message="Are you sure you want to clear all generation history? This action cannot be undone."
      />
    </div>
  );
});

export default GenerationHistory;
