'use client';

import { useEffect, useMemo, memo } from 'react';
import {
  FaTimes,
  FaBolt,
  FaVideo,
  FaMobileAlt,
  FaTv,
  FaMagic,
  FaCheckCircle,
} from 'react-icons/fa';

export type VideoFormat = 'short' | 'long';

interface FormatSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFormat: (format: VideoFormat) => void;
  text: string;
  isGenerating?: boolean;
}

const FormatSelectionModal = memo(function FormatSelectionModal({
  isOpen,
  onClose,
  onSelectFormat,
  text,
  isGenerating = false,
}: FormatSelectionModalProps) {
  // Analyze text length to calculate words, chars, and estimated speaking duration
  const analysis = useMemo(() => {
    const trimmed = text.trim();
    if (!trimmed) {
      return {
        wordCount: 0,
        charCount: 0,
        estimatedSec: 0,
        recommended: 'short' as VideoFormat,
      };
    }

    const words = trimmed.split(/\s+/).filter(Boolean).length;
    const chars = trimmed.length;
    // Average speaking rate: ~150 words per minute => 2.5 words per second
    const estimatedSec = Math.max(1, Math.round(words / 2.5));
    // Shorts are typically <= 60 seconds or under ~800 characters
    const recommended: VideoFormat = estimatedSec <= 60 && chars < 900 ? 'short' : 'long';

    return {
      wordCount: words,
      charCount: chars,
      estimatedSec,
      recommended,
    };
  }, [text]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-format-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/70 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-gray-100 relative animate-scaleUp overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle decorative background gradient */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#ff9b8f] via-amber-400 to-[#ff7d6e]" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center transition-colors cursor-pointer"
        >
          <FaTimes className="text-sm" />
        </button>

        {/* Header */}
        <div className="mb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-[#ff7d6e] text-xs font-bold mb-2">
            <FaVideo className="text-xs" />
            <span>Target Video Type</span>
          </div>
          <h2
            id="modal-format-title"
            className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight"
          >
            What type of video are you creating?
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Choose your format to tag the generated audio and optimize video building.
          </p>
        </div>

        {/* AI Estimation & Recommendation Pill */}
        {analysis.wordCount > 0 && (
          <div className="mb-5 p-3 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-amber-900 font-medium">
              <FaMagic className="text-amber-500 flex-shrink-0 text-sm" />
              <span>
                <strong>{analysis.wordCount}</strong> words • Estimated{' '}
                <strong>
                  {analysis.estimatedSec < 60
                    ? `~${analysis.estimatedSec}s`
                    : `~${(analysis.estimatedSec / 60).toFixed(1)}m`}
                </strong>{' '}
                voice duration
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-amber-200/80 text-amber-900 text-[10px] font-bold uppercase tracking-wider">
              {analysis.recommended === 'short' ? 'Shorts Recommended' : 'Long Recommended'}
            </span>
          </div>
        )}

        {/* 2 Format Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-5">
          {/* 1. Short Format Card */}
          <button
            type="button"
            disabled={isGenerating}
            onClick={() => onSelectFormat('short')}
            className={`group p-4 rounded-2xl border-2 text-left transition-all duration-200 flex flex-col justify-between cursor-pointer relative ${
              analysis.recommended === 'short'
                ? 'border-[#ff9b8f] bg-gradient-to-b from-red-50/70 to-white shadow-md shadow-[#ff9b8f]/10 hover:scale-[1.02]'
                : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50/80 hover:scale-[1.01]'
            }`}
          >
            {analysis.recommended === 'short' && (
              <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-gradient-to-r from-[#ff9b8f] to-[#ff7d6e] text-white text-[9px] font-black uppercase tracking-wider shadow-xs flex items-center gap-1">
                <FaCheckCircle className="text-[8px]" />
                Recommended
              </span>
            )}

            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-100 to-orange-100 text-[#ff7d6e] flex items-center justify-center text-lg shadow-xs group-hover:scale-110 transition-transform">
                <FaMobileAlt />
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                9:16 Vertical
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-gray-900 group-hover:text-[#ff7d6e] transition-colors flex items-center gap-1.5">
                <span>Short Video</span>
                <FaBolt className="text-amber-500 text-xs" />
              </h3>
              <p className="text-[11px] text-gray-500 mt-1 leading-snug">
                YouTube Shorts, Instagram Reels, TikTok (<strong className="text-gray-700">&lt; 60s</strong>)
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-[#ff7d6e]">
              <span>Generate Short</span>
              <span className="text-base leading-none">&rarr;</span>
            </div>
          </button>

          {/* 2. Long Format Card */}
          <button
            type="button"
            disabled={isGenerating}
            onClick={() => onSelectFormat('long')}
            className={`group p-4 rounded-2xl border-2 text-left transition-all duration-200 flex flex-col justify-between cursor-pointer relative ${
              analysis.recommended === 'long'
                ? 'border-[#ff9b8f] bg-gradient-to-b from-red-50/70 to-white shadow-md shadow-[#ff9b8f]/10 hover:scale-[1.02]'
                : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50/80 hover:scale-[1.01]'
            }`}
          >
            {analysis.recommended === 'long' && (
              <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-gradient-to-r from-[#ff9b8f] to-[#ff7d6e] text-white text-[9px] font-black uppercase tracking-wider shadow-xs flex items-center gap-1">
                <FaCheckCircle className="text-[8px]" />
                Recommended
              </span>
            )}

            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 text-indigo-600 flex items-center justify-center text-lg shadow-xs group-hover:scale-110 transition-transform">
                <FaTv />
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                16:9 Landscape
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-gray-900 group-hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                <span>Long Video</span>
                <FaVideo className="text-indigo-500 text-xs" />
              </h3>
              <p className="text-[11px] text-gray-500 mt-1 leading-snug">
                YouTube Videos, Explainers, Podcasts, Documentaries (<strong className="text-gray-700">&gt; 1 min</strong>)
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-indigo-600">
              <span>Generate Long</span>
              <span className="text-base leading-none">&rarr;</span>
            </div>
          </button>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-center text-[11px] text-gray-400 text-center">
          <span>Clicking either option automatically applies format tagging to your download file.</span>
        </div>
      </div>
    </div>
  );
});

export default FormatSelectionModal;
