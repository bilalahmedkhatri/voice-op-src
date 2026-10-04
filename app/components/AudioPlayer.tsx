'use client';

import { useState, useRef, useEffect, memo } from 'react';
import { FaPlay, FaPause, FaDownload, FaRedoAlt, FaBolt, FaBookmark, FaCheck, FaSlidersH } from 'react-icons/fa';
import { generateVoiceoverFilename } from '../lib/filenameUtils';

export interface ActiveVoiceMeta {
  voice_id: string;
  voice_name: string;
  language?: string;
  gender?: string;
  model_id?: string;
  model_name?: string;
}

interface AudioPlayerProps {
  audioUrl: string | null;
  audioBlob?: Blob | null;
  jobId?: string | null;
  onAudioUrlRenewed?: (newUrl: string) => void;
  isGenerating?: boolean;
  generationTime?: number | null;
  videoFormat?: 'short' | 'long' | string;
  onEnded?: () => void;
  fileName?: string;
  activeVoiceMeta?: ActiveVoiceMeta | null;
  activeParameters?: Record<string, any> | null;
  onSavePreset?: (presetName?: string) => Promise<boolean>;
}

const WAVE_BARS = [
  30, 45, 65, 80, 50, 35, 70, 95, 85, 60, 40, 55, 75, 90, 65, 45,
  35, 55, 75, 95, 80, 60, 45, 70, 85, 90, 65, 50, 40, 60, 80, 65, 45, 30
];

const AudioPlayer = memo(function AudioPlayer({
  audioUrl,
  audioBlob,
  jobId,
  onAudioUrlRenewed,
  isGenerating = false,
  generationTime,
  videoFormat,
  onEnded,
  fileName = 'voiceover.wav',
  activeVoiceMeta,
  activeParameters,
  onSavePreset,
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isRenewing, setIsRenewing] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [resolvedAudioUrl, setResolvedAudioUrl] = useState<string | null>(audioUrl);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const isRenewingRef = useRef(false);

  const isProcessing = isLoading || isRenewing;

  // Sync resolvedAudioUrl whenever audioUrl prop changes
  useEffect(() => {
    setResolvedAudioUrl(audioUrl);
    isRenewingRef.current = false;
  }, [audioUrl]);

  // Manage blob URL lifecycle safely
  useEffect(() => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      setBlobUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setBlobUrl(null);
    }
  }, [audioBlob]);

  const activeSrc = blobUrl || resolvedAudioUrl;

  // Helper to renew expired or invalid URL via the backend status endpoint
  const renewUrl = async (): Promise<string | null> => {
    if (!jobId || isRenewingRef.current) return null;
    isRenewingRef.current = true;
    setIsRenewing(true);
    try {
      setIsLoading(true);
      const res = await fetch(`/api/templates/audio-job/status?jobId=${jobId}`);
      if (res.ok) {
        const data = await res.json();
        if ((data.status === 'completed' || data.status === 'success') && data.audio_url) {
          setResolvedAudioUrl(data.audio_url);
          onAudioUrlRenewed?.(data.audio_url);
          return data.audio_url;
        }
      }
    } catch (err) {
      console.error('Failed to renew audio URL via status check:', err);
    } finally {
      setIsLoading(false);
      setIsRenewing(false);
    }
    return null;
  };

  // Setup audio element
  useEffect(() => {
    if (!activeSrc) {
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      return;
    }

    setIsLoading(true);
    const audio = new Audio(activeSrc);
    audioRef.current = audio;

    audio.onloadedmetadata = () => {
      setDuration(audio.duration || 0);
      setIsLoading(false);
    };

    audio.oncanplay = () => {
      setIsLoading(false);
    };

    audio.onwaiting = () => {
      setIsLoading(true);
    };

    audio.onplaying = () => {
      setIsLoading(false);
      setIsPlaying(true);
    };

    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
    };

    audio.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      onEnded?.();
    };

    audio.onerror = async () => {
      // Auto-renew if audio fails to load (e.g. 403 Forbidden or expired URL)
      if (jobId && !isRenewingRef.current) {
        const newUrl = await renewUrl();
        if (newUrl) return; // audio element will re-mount with fresh activeSrc
      }
      setIsLoading(false);
      setIsPlaying(false);
    };

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, [activeSrc, onEnded, jobId]);

  // Stop playback when new generation starts
  useEffect(() => {
    if (isGenerating && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, [isGenerating]);

  const handlePlayPause = async () => {
    if (!activeSrc) {
      if (jobId && !isRenewingRef.current) {
        await renewUrl();
      }
      return;
    }

    if (!audioRef.current) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch {
      // If play failed due to media error, attempt renewal
      if (jobId && !isRenewingRef.current) {
        const newUrl = await renewUrl();
        if (newUrl) return;
      }
      setIsPlaying(false);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration || duration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleDownload = async () => {
    let srcToDownload = activeSrc;
    if (!srcToDownload) {
      if (jobId && !isRenewingRef.current) {
        srcToDownload = await renewUrl();
      }
      if (!srcToDownload) return;
    }

    if (isDownloading) return;

    const effectiveFilename =
      fileName && fileName !== 'voiceover.wav'
        ? fileName
        : generateVoiceoverFilename({
            videoFormat: videoFormat || activeParameters?.video_format,
            voiceName: activeVoiceMeta?.voice_name || 'voice',
            language: activeVoiceMeta?.language,
            parameters: activeParameters || undefined,
          });

    try {
      setIsDownloading(true);

      // If already a local blob URL or data URI, download directly
      if (srcToDownload.startsWith('blob:') || srcToDownload.startsWith('data:')) {
        const a = document.createElement('a');
        a.href = srcToDownload;
        a.download = effectiveFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }

      // For remote URLs (e.g. Backblaze S3 presigned URLs), fetch as a blob first
      // to avoid cross-origin redirect navigation in modern browsers
      let response = await fetch(srcToDownload);
      // If 403 (expired presigned URL), attempt renew once
      if (response.status === 403 && jobId && !isRenewingRef.current) {
        const renewed = await renewUrl();
        if (renewed) {
          srcToDownload = renewed;
          response = await fetch(renewed);
        }
      }

      if (!response.ok) {
        throw new Error(`Failed to download audio file: ${response.status}`);
      }

      const blob = await response.blob();
      const localBlobUrl = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = localBlobUrl;
      a.download = effectiveFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setTimeout(() => {
        URL.revokeObjectURL(localBlobUrl);
      }, 10000);
    } catch (err) {
      console.error('Download error:', err);
      // Fallback: trigger standard download link
      const a = document.createElement('a');
      a.href = srcToDownload;
      a.download = effectiveFilename;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleReplay = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    setCurrentTime(0);
    audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
  };

  const handleSave = async () => {
    if (!onSavePreset || isSaving || isSaved) return;
    try {
      setIsSaving(true);
      const defaultName = activeVoiceMeta ? `${activeVoiceMeta.voice_name} Preset` : 'Custom Voice Preset';
      const success = await onSavePreset(defaultName);
      if (success) {
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || !isFinite(time) || time < 0) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!activeSrc) {
    return null;
  }

  return (
    <div className="flex flex-col gap-1 p-1 animate-slideUp">
      {/* 1. Progress Bar Section */}
      <div className="flex flex-col gap-1 w-full px-1">
        <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-mono text-slate-700 font-medium px-1">
          <span>{formatTime(currentTime)}</span>
          <div className="flex items-center gap-1.5">
            {generationTime !== undefined && generationTime !== null && (
              <span className="inline-flex items-center gap-1 px-1 py-0.5 rounded text-[9px] font-sans font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                <FaBolt className="text-[8px]" />
                <span>{generationTime}s</span>
              </span>
            )}
            <span className="text-slate-500">{formatTime(duration)}</span>
          </div>
        </div>

        <div
          ref={progressBarRef}
          onClick={handleSeek}
          className="w-full h-1.5 bg-slate-200 hover:bg-slate-300 rounded-full relative cursor-pointer overflow-hidden transition-colors mb-0.5"
          title="Click or drag to seek"
        >
          <div 
            className="absolute top-0 left-0 h-full bg-[#ff7d6e] rounded-full pointer-events-none transition-all duration-100" 
            style={{ width: `${progressPercent}%` }} 
          />
        </div>
      </div>

      {/* 2. Controls Section */}
      <div className="flex items-center justify-center gap-4 sm:gap-6 w-full mt-0.5">
        <button
          type="button"
          onClick={handleReplay}
          title="Replay from start"
          className="w-5 h-5 text-slate-600 transition-opacity hover:opacity-70 cursor-pointer flex items-center justify-center flex-shrink-0 bg-transparent border-none"
        >
          <FaRedoAlt className="text-[11px] sm:text-xs" />
        </button>

        <button
          type="button"
          onClick={handlePlayPause}
          disabled={isProcessing}
          aria-label={isProcessing ? 'Loading voiceover' : isPlaying ? 'Pause voiceover' : 'Play voiceover'}
          className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer transition-all duration-200 shadow-sm ${
            isProcessing
              ? 'bg-gradient-to-br from-amber-500 to-[#ff7d6e] text-white opacity-90 cursor-wait'
              : isPlaying
              ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-amber-500/30 scale-105'
              : 'bg-gradient-to-br from-[#ff9b8f] to-[#ff7d6e] hover:from-[#ff8a7d] hover:to-[#ff6c5b] text-white shadow-[#ff9b8f]/30 hover:scale-105'
          }`}
        >
          {isProcessing ? (
            <FaRedoAlt className="text-[10px] sm:text-[11px] animate-spin" />
          ) : isPlaying ? (
            <FaPause className="text-[10px] sm:text-[11px]" />
          ) : (
            <FaPlay className="text-[10px] sm:text-[11px] ml-0.5" />
          )}
        </button>

        <button
          type="button"
          onClick={handleDownload}
          disabled={isDownloading}
          title="Download audio WAV"
          className="w-5 h-5 text-slate-600 transition-opacity hover:opacity-70 cursor-pointer flex items-center justify-center flex-shrink-0 bg-transparent border-none disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDownloading ? (
            <FaRedoAlt className="text-[11px] sm:text-xs animate-spin" />
          ) : (
            <FaDownload className="text-[11px] sm:text-xs" />
          )}
        </button>
      </div>

      {/* 2. Embedded Voice Parameters & Save Preset Single-Row Bar */}
      {activeVoiceMeta && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pt-3 border-t border-slate-200/80 text-xs text-slate-600">
          {/* Metadata & Dynamic Parameters Badges */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Format Badge (Short vs Long) */}
            {videoFormat && (
              <span
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                  videoFormat === 'short'
                    ? 'bg-rose-50 text-rose-700 border-rose-200/80'
                    : 'bg-amber-50 text-amber-900 border-amber-200/80'
                }`}
              >
                {videoFormat === 'short' ? '⚡ Short Format (9:16)' : '🎬 Long Format (16:9)'}
              </span>
            )}

            <span className="px-2.5 py-0.5 bg-slate-100 text-slate-800 rounded-lg text-[11px] font-bold border border-slate-200 shadow-2xs">
              {activeVoiceMeta.voice_name}
            </span>

            {activeVoiceMeta.language && (
              <span className="px-2 py-0.5 bg-slate-50 text-slate-600 rounded-lg text-[10px] font-semibold border border-slate-200">
                {activeVoiceMeta.language}
              </span>
            )}

            {activeVoiceMeta.gender && (
              <span className="px-2 py-0.5 bg-slate-50 text-slate-500 rounded-lg text-[10px] font-medium border border-slate-200">
                {activeVoiceMeta.gender}
              </span>
            )}

            {/* Dynamic model parameters (Speed, Temperature, etc.) */}
            {activeParameters &&
              Object.entries(activeParameters).map(([key, val]) => {
                if (val === undefined || val === null) return null;
                const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
                const formattedVal =
                  typeof val === 'number' && (key === 'speed' || key === 'rate')
                    ? `${val}x`
                    : String(val);
                return (
                  <span
                    key={key}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-50/80 text-orange-950 rounded-lg text-[10px] font-medium border border-orange-200/70"
                  >
                    <FaSlidersH className="text-[8px] text-[#ff7d6e]" />
                    <span>{label}: <strong>{formattedVal}</strong></span>
                  </span>
                );
              })}
          </div>

          {/* Right Action: Save Preset Button */}
          {onSavePreset && (
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className={`h-7 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer flex-shrink-0 shadow-2xs ${
                isSaved
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white hover:bg-orange-50/60 text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-[#ff9b8f]/60'
              }`}
            >
              {isSaved ? (
                <>
                  <FaCheck className="text-[10px]" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <FaBookmark className="text-[10px] text-[#ff7d6e]" />
                  <span>Save Preset</span>
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
});

export default AudioPlayer;
