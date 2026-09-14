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
  isGenerating?: boolean;
  generationTime?: number | null;
  videoFormat?: 'short' | 'long' | string;
  onEnded?: () => void;
  fileName?: string;
  activeVoiceMeta?: ActiveVoiceMeta | null;
  activeParameters?: Record<string, any> | null;
  onSavePreset?: (presetName?: string) => Promise<boolean>;
}

const AudioPlayer = memo(function AudioPlayer({
  audioUrl,
  audioBlob,
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
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

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

  const activeSrc = blobUrl || audioUrl;

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

    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
    };

    audio.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      onEnded?.();
    };

    audio.onerror = () => {
      setIsLoading(false);
      setIsPlaying(false);
    };

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, [activeSrc, onEnded]);

  // Stop playback when new generation starts
  useEffect(() => {
    if (isGenerating && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, [isGenerating]);

  const handlePlayPause = async () => {
    if (!audioRef.current || !activeSrc) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch {
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

  const handleDownload = () => {
    if (!activeSrc) return;
    const effectiveFilename =
      fileName && fileName !== 'voiceover.wav'
        ? fileName
        : generateVoiceoverFilename({
            videoFormat: videoFormat || activeParameters?.video_format,
            voiceName: activeVoiceMeta?.voice_name || 'voice',
            language: activeVoiceMeta?.language,
            parameters: activeParameters || undefined,
          });

    const a = document.createElement('a');
    a.href = activeSrc;
    a.download = effectiveFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
    <div className="flex flex-col gap-3 p-3.5 sm:p-4 bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-2xl shadow-lg border border-gray-700/60 animate-slideUp">
      {/* 1. Main Player Controls Row */}
      <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full">
        {/* Left: Play/Pause Circular Button */}
        <button
          type="button"
          onClick={handlePlayPause}
          disabled={isLoading}
          aria-label={isPlaying ? 'Pause voiceover' : 'Play voiceover'}
          className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer transition-all duration-200 shadow-md ${
            isPlaying
              ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-amber-500/30 scale-105'
              : 'bg-gradient-to-br from-[#ff9b8f] to-[#ff7d6e] hover:from-[#ff8a7d] hover:to-[#ff6c5b] text-white shadow-[#ff9b8f]/30 hover:scale-105'
          }`}
        >
          {isPlaying ? (
            <FaPause className="text-sm" />
          ) : (
            <FaPlay className="text-sm ml-0.5" />
          )}
        </button>

        {/* Middle: Scrubbable Progress Bar & Waveform Tracker */}
        <div className="flex-1 w-full flex flex-col gap-1.5 min-w-0">
          <div className="flex items-center justify-between text-[11px] sm:text-xs font-mono text-gray-300 font-medium">
            <span className="text-white">{formatTime(currentTime)}</span>
            
            <div className="flex items-center gap-2">
              {generationTime !== undefined && generationTime !== null && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-sans font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-800/40">
                  <FaBolt className="text-[9px]" />
                  <span>{generationTime}s</span>
                </span>
              )}
              <span className="text-gray-400">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Interactive Scrubbable Bar */}
          <div
            ref={progressBarRef}
            onClick={handleSeek}
            className="w-full h-2.5 bg-gray-700/80 hover:h-3 rounded-full relative cursor-pointer overflow-hidden transition-all duration-150"
            title="Click to seek"
          >
            {/* Wave Background Lines Effect */}
            <div className="absolute inset-0 opacity-20 flex items-center justify-between px-1 pointer-events-none">
              {Array.from({ length: 30 }).map((_, i) => (
                <div
                  key={i}
                  className="w-0.5 bg-white rounded-full"
                  style={{ height: `${20 + ((i * 7) % 60)}%` }}
                />
              ))}
            </div>

            {/* Active progress fill */}
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#ff9b8f] to-amber-400 rounded-full transition-all duration-75"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Right Actions: Replay & Download */}
        <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={handleReplay}
            title="Replay from start"
            aria-label="Replay from start"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-all cursor-pointer border border-gray-700/80 flex items-center justify-center flex-shrink-0"
          >
            <FaRedoAlt className="text-xs sm:text-sm" />
          </button>

          <button
            type="button"
            onClick={handleDownload}
            title="Download audio WAV"
            className="h-9 sm:h-10 flex items-center justify-center gap-1.5 px-3.5 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold bg-white text-gray-900 hover:bg-gray-100 transition-all shadow-xs cursor-pointer flex-shrink-0"
          >
            <FaDownload className="text-xs" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* 2. Embedded Voice Parameters & Save Preset Single-Row Bar */}
      {activeVoiceMeta && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2.5 border-t border-gray-700/60 text-xs text-gray-300">
          {/* Metadata & Dynamic Parameters Badges */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Format Badge (Short vs Long) */}
            {videoFormat && (
              <span
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                  videoFormat === 'short'
                    ? 'bg-rose-950/90 text-rose-300 border-rose-800/60'
                    : 'bg-indigo-950/90 text-indigo-300 border-indigo-800/60'
                }`}
              >
                {videoFormat === 'short' ? '⚡ Short Format (9:16)' : '🎬 Long Format (16:9)'}
              </span>
            )}

            <span className="px-2 py-0.5 bg-gray-800 text-gray-200 rounded-lg text-[11px] font-bold border border-gray-700">
              {activeVoiceMeta.voice_name}
            </span>

            {activeVoiceMeta.language && (
              <span className="px-2 py-0.5 bg-gray-800 text-gray-300 rounded-lg text-[10px] font-semibold border border-gray-700">
                {activeVoiceMeta.language}
              </span>
            )}

            {activeVoiceMeta.gender && (
              <span className="px-2 py-0.5 bg-gray-800 text-gray-400 rounded-lg text-[10px] font-medium border border-gray-700">
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
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-800/90 text-amber-300 rounded-lg text-[10px] font-medium border border-gray-700/80"
                  >
                    <FaSlidersH className="text-[8px] text-amber-400/80" />
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
              className={`h-7 px-3 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer flex-shrink-0 ${
                isSaved
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-200 hover:text-white border border-gray-600'
              }`}
            >
              {isSaved ? (
                <>
                  <FaCheck className="text-[10px]" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <FaBookmark className="text-[10px] text-[#ff9b8f]" />
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
