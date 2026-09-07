'use client';

import { useState, useRef, useEffect, memo } from 'react';
import { FaPlay, FaPause, FaDownload, FaRedoAlt, FaBolt } from 'react-icons/fa';

interface AudioPlayerProps {
  audioUrl: string | null;
  audioBlob?: Blob | null;
  isGenerating?: boolean;
  generationTime?: number | null;
  onEnded?: () => void;
  fileName?: string;
}

const AudioPlayer = memo(function AudioPlayer({
  audioUrl,
  audioBlob,
  isGenerating = false,
  generationTime,
  onEnded,
  fileName = 'voiceover.wav',
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

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
    const a = document.createElement('a');
    a.href = activeSrc;
    a.download = fileName;
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
    <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 p-3.5 sm:p-4 bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-2xl shadow-lg border border-gray-700/60 animate-slideUp">
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
  );
});

export default AudioPlayer;
