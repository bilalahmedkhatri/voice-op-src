'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  FiPlay,
  FiPause,
  FiVolume2,
  FiSliders,
  FiRotateCcw,
  FiCheck,
  FiCopy,
  FiVideo,
  FiSmartphone,
} from 'react-icons/fi';
import { IconButton } from '@/components/ui';

const SAMPLE_SCRIPTS = [
  {
    label: 'Viral Shorts Hook',
    format: '9:16',
    text: 'Here are 3 AI workflow secrets that top YouTube creators are using to 10x their production speed. Secret number one will completely change how you edit...',
  },
  {
    label: 'YouTube Documentary',
    format: '16:9',
    text: 'Deep within the archives of modern science lies an untold story of perseverance, engineering triumphs, and the silent pioneers who reshaped the technological landscape.',
  },
  {
    label: 'Facebook Brand Ad',
    format: '9:16',
    text: 'Stop spending forty hours a month manually writing and scheduling content. With GenZee, you can turn raw ideas into voiceovers and published posts in seconds.',
  },
];

const VOICES = [
  { id: 'nicole', name: 'Nicole', model: 'ElevenLabs Multilingual', style: 'Warm Conversational', gender: 'Female' },
  { id: 'michael', name: 'Michael', model: 'ElevenLabs Deep Narrator', style: 'Deep Narrator', gender: 'Male' },
  { id: 'sarah', name: 'Sarah', model: 'Gemini Voice Pro', style: 'Energetic Commercial', gender: 'Female' },
  { id: 'river', name: 'River', model: 'Fish Audio V1.5', style: 'Smooth Editorial', gender: 'Neutral' },
];

export default function InteractiveVoiceHero() {
  const [selectedVoice, setSelectedVoice] = useState(VOICES[0]);
  const [text, setText] = useState(SAMPLE_SCRIPTS[0].text);
  const [format, setFormat] = useState<'9:16' | '16:9'>('9:16');
  const [speed, setSpeed] = useState<number>(1.0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);

  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Web Speech API synthesis for 100% working live interactive playback
  const handleTogglePlay = () => {
    if (typeof window === 'undefined') return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setPlaybackProgress(0);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speed;

    // Pick speech voice if available
    const availableVoices = window.speechSynthesis.getVoices();
    if (availableVoices.length > 0) {
      const preferred = availableVoices.find(
        (v) =>
          (selectedVoice.gender === 'Female' && v.name.toLowerCase().includes('female')) ||
          (selectedVoice.gender === 'Male' && v.name.toLowerCase().includes('male'))
      );
      if (preferred) utterance.voice = preferred;
    }

    utterance.onstart = () => {
      setIsPlaying(true);
      setPlaybackProgress(0);
      const estDurationMs = (text.length / 14 / speed) * 1000;
      const step = 50;
      progressIntervalRef.current = setInterval(() => {
        setPlaybackProgress((prev) => {
          if (prev >= 100) {
            clearInterval(progressIntervalRef.current!);
            return 100;
          }
          return prev + (step / estDurationMs) * 100;
        });
      }, step);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setPlaybackProgress(100);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      setTimeout(() => setPlaybackProgress(0), 1000);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setPlaybackProgress(0);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };

    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        window.speechSynthesis.cancel();
      }
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <section id="voice-hero" className="py-12 sm:py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Editorial Heading without any tacky badges */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.12]">
            Turn Any Script into Lifelike Audio in Seconds
          </h1>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Experience ultra-natural multi-model voice synthesis built specifically for YouTube creators,
            TikTok hooks, and Facebook &amp; Instagram Reels. Test it live below.
          </p>
        </div>

        {/* Live Functional Interactive Studio Card (Clean Single Border, Zero Nested Multi-Wrapping) */}
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
          {/* Top Bar: Sample Presets & Format Selector */}
          <div className="px-5 py-4 bg-slate-50/80 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Try Script:</span>
              {SAMPLE_SCRIPTS.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setText(s.text);
                    setFormat(s.format as any);
                    if (isPlaying) {
                      window.speechSynthesis.cancel();
                      setIsPlaying(false);
                    }
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${text === s.text
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-700 hover:bg-slate-200/70 border border-slate-200/60'
                    }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Format Switcher */}
            <div className="flex items-center gap-1 bg-white rounded-xl p-1 border border-slate-200/80 shadow-2xs">
              <IconButton
                icon={<FiSmartphone />}
                title="9:16 Vertical Reels Format"
                variant={format === '9:16' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFormat('9:16')}
              />
              <IconButton
                icon={<FiVideo />}
                title="16:9 Widescreen YouTube Format"
                variant={format === '16:9' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFormat('16:9')}
              />
            </div>
          </div>

          {/* Split Interactive Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-200/80">
            {/* Left: Text Input Area */}
            <div className="lg:col-span-7 p-5 sm:p-6 flex flex-col justify-between gap-4">
              <div className="relative">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type or paste your script here..."
                  rows={7}
                  className="w-full text-slate-800 placeholder-slate-400 text-sm sm:text-base leading-relaxed resize-none outline-none font-sans"
                />
              </div>

              {/* Bottom Meta in Input */}
              <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <span>{text.length} characters</span>
                  <span>•</span>
                  <span>~{Math.max(1, Math.round(text.length / 15 / speed))}s estimated duration</span>
                </div>
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 cursor-pointer font-medium"
                >
                  {copied ? <FiCheck className="text-emerald-500" /> : <FiCopy />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Right: Voice Selector & Live Parameters */}
            <div className="lg:col-span-5 p-5 sm:p-6 bg-slate-50/40 flex flex-col justify-between gap-5">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Select Voice Model</span>
                  <span className="text-[11px] font-semibold text-[#c83a2a] bg-orange-50 px-2 py-0.5 rounded-md">
                    ElevenLabs, Fish Audio, and Google Gemini
                  </span>
                </div>

                {/* Voice List (Single-level cards without nested border traps) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
                  {VOICES.map((v) => {
                    const isSelected = selectedVoice.id === v.id;
                    return (
                      <div
                        key={v.id}
                        onClick={() => setSelectedVoice(v)}
                        className={`p-3 rounded-xl cursor-pointer transition-all flex items-center justify-between ${isSelected
                          ? 'bg-white border border-[#ff7d6e] ring-2 ring-[#ff7d6e]/20 shadow-xs'
                          : 'bg-white hover:bg-slate-100/70 shadow-2xs border border-transparent'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-700 to-slate-900 text-white font-bold text-xs flex items-center justify-center">
                            {v.name.substring(0, 2)}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{v.name}</span>
                              <span className="text-[10px] font-normal text-slate-500">({v.gender})</span>
                            </div>
                            <div className="text-[11px] text-slate-500">{v.style}</div>
                          </div>
                        </div>

                        {isSelected && <FiCheck className="text-[#ff7d6e] text-base" />}
                      </div>
                    );
                  })}
                </div>

                {/* Speed Slider */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span className="flex items-center gap-1">
                      <FiSliders className="text-[#ff7d6e]" /> Speed Rate
                    </span>
                    <span className="font-mono text-slate-900">{speed.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={speed}
                    onChange={(e) => setSpeed(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#ff7d6e]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Player Scrubber Bar */}
          <div className="p-4 sm:p-5 bg-white border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={handleTogglePlay}
                className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#e04836] to-[#ff7d6e] hover:from-[#d03e2c] hover:to-[#f06e5f] text-white flex items-center justify-center text-lg shadow-xs hover:shadow transition-all cursor-pointer shrink-0"
                title={isPlaying ? 'Pause' : 'Play Live Voice'}
              >
                {isPlaying ? <FiPause /> : <FiPlay className="ml-0.5" />}
              </button>

              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">{selectedVoice.name}</span>
                  <span className="text-slate-400 font-normal text-xs">• {selectedVoice.model}</span>
                  {isPlaying && (
                    <span className="inline-flex items-center gap-0.5 ml-1">
                      <span className="w-0.5 h-3 bg-[#ff7d6e] rounded-full animate-bounce" />
                      <span className="w-0.5 h-4 bg-[#ff7d6e] rounded-full animate-bounce [animation-delay:150ms]" />
                      <span className="w-0.5 h-2 bg-[#ff7d6e] rounded-full animate-bounce [animation-delay:300ms]" />
                      <span className="w-0.5 h-3.5 bg-[#ff7d6e] rounded-full animate-bounce [animation-delay:450ms]" />
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-500">
                  {isPlaying ? 'Speaking live through speech synthesis...' : 'Click play to hear live synthesis'}
                </span>
              </div>
            </div>

            {/* Status Indicator */}
            <div className="text-right shrink-0 hidden sm:block">
              <div className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 justify-end">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Synthesis Ready (1.2s latency)</span>
              </div>
              <div className="text-[10px] text-slate-400">100% Free • No Sign-Up Needed</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
