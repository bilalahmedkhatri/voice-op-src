'use client';

import { useState, useEffect, useRef, memo } from 'react';
import {
  FaHistory,
  FaPlay,
  FaPause,
  FaDownload,
  FaTrash,
  FaBolt,
  FaArrowRight,
  FaGoogle,
  FaVolumeUp,
  FaLaptopCode,
} from 'react-icons/fa';
import { isDatabaseEnabled } from '../lib/config';
import {
  getLocalHistoryItems,
  deleteLocalHistoryItem,
  clearAllLocalHistory,
  LocalHistoryItem,
} from '../lib/localHistoryStorage';

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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlsRef = useRef<Record<string, string>>({});

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(blobUrlsRef.current).forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch {}
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
      onHistoryCountChange?.(unified.length);
    } catch (e) {
      console.error('Error loading offline local history:', e);
      setHistoryItems([]);
      onHistoryCountChange?.(0);
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
        onHistoryCountChange?.(items.length);
      } else {
        setAuthenticated(false);
        // Fallback to local storage if user not signed in online
        const localItems = await getLocalHistoryItems();
        setHistoryItems(localItems as any);
        onHistoryCountChange?.(localItems.length);
      }
    } catch (e) {
      console.error('Error loading online history:', e);
      setHistoryItems([]);
      onHistoryCountChange?.(0);
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

      setHistoryItems((prev) => {
        const updated = prev.filter((it) => it.id !== id);
        onHistoryCountChange?.(updated.length);
        return updated;
      });
    } catch (e) {
      console.error('Failed to delete history item:', e);
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to clear all generation history?')) return;
    try {
      if (isOfflineMode || !authenticated) {
        await clearAllLocalHistory();
      } else {
        await fetch('/api/history?clear_all=true', { method: 'DELETE' });
      }

      setHistoryItems([]);
      onHistoryCountChange?.(0);
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
      <div className="flex flex-col items-center justify-center p-6 sm:p-8 text-center bg-gray-50/60 rounded-2xl border border-gray-100">
        <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#ff9b8f] flex items-center justify-center mb-3">
          <FaHistory className="text-xl" />
        </div>
        <h4 className="text-sm font-bold text-gray-900 mb-1">
          Sign In to Sync History
        </h4>
        <p className="text-xs text-gray-500 max-w-xs mb-4">
          Save your generated voiceovers in the cloud, reuse prompts, and access them across all devices.
        </p>
        <a
          href="/api/auth/google"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white text-gray-800 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 shadow-2xs transition-all cursor-pointer"
        >
          <FaGoogle className="text-red-500" />
          <span>Sign In with Google</span>
        </a>
      </div>
    );
  }

  if (historyItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50/60 rounded-2xl border border-gray-100">
        <div className="w-12 h-12 rounded-2xl bg-[#ff9b8f]/10 text-[#ff9b8f] flex items-center justify-center mb-3">
          <FaVolumeUp className="text-xl" />
        </div>
        <h4 className="text-sm font-bold text-gray-900 mb-1">
          No Voiceovers in History Yet
        </h4>
        <p className="text-xs text-gray-500 max-w-xs">
          Generate your first speech audio on the left and it will automatically appear here with playback and download options.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* History Header & Clear Action */}
      <div className="flex items-center justify-between px-1 pb-1 border-b border-gray-100">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
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
          onClick={handleClearAll}
          className="text-[11px] font-semibold text-red-500 hover:text-red-700 hover:underline cursor-pointer"
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
              className="p-3 bg-white rounded-2xl border border-gray-100 hover:border-gray-200 shadow-2xs hover:shadow-xs transition-all flex flex-col gap-2"
            >
              {/* Top Row: Meta Tags & Actions */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="px-2 py-0.5 bg-[#ff9b8f]/15 text-gray-900 rounded-lg text-[10px] font-bold">
                    {item.voice_name}
                  </span>
                  <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-medium">
                    {item.model_name}
                  </span>
                  {item.generation_time_sec && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-bold border border-emerald-200/60">
                      <FaBolt className="text-[8px]" />
                      <span>{item.generation_time_sec}s</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-[10px] text-gray-400">
                  <span>{formatRelativeTime(item.created_at)}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(item.id)}
                    disabled={deletingId === item.id}
                    title="Delete item"
                    className="text-gray-400 hover:text-red-500 transition-colors p-1 cursor-pointer"
                  >
                    <FaTrash className="text-[10px]" />
                  </button>
                </div>
              </div>

              {/* Prompt Text Preview */}
              <p className="text-xs text-gray-700 line-clamp-2 leading-relaxed bg-gray-50/70 p-2 rounded-xl">
                {item.prompt_text}
              </p>

              {/* Bottom Actions Row: Play, Download, Use In Editor */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handlePlayToggle(item)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      isPlaying
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-[#ff9b8f] hover:bg-[#f8887a] text-white shadow-2xs'
                    }`}
                  >
                    {isPlaying ? <FaPause className="text-[9px]" /> : <FaPlay className="text-[9px]" />}
                    <span>{isPlaying ? 'Pause' : 'Play'}</span>
                  </button>

                  {item.audio_url && (
                    <a
                      href={item.audio_url}
                      download={`voiceover_${item.voice_name}.wav`}
                      className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
                      title="Download audio"
                    >
                      <FaDownload className="text-[10px]" />
                    </a>
                  )}
                </div>

                {onLoadPrompt && (
                  <button
                    type="button"
                    onClick={() => onLoadPrompt(item.prompt_text)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#ff9b8f] hover:text-[#f8887a] transition-colors cursor-pointer"
                  >
                    <span>Use in Editor</span>
                    <FaArrowRight className="text-[9px]" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default GenerationHistory;
