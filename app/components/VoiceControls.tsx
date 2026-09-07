'use client';

import { memo, useState, useEffect, useRef } from 'react';
import {
  FaPlay,
  FaPause,
  FaMicrophone,
  FaSearch,
  FaCheck,
  FaHeart,
  FaRegHeart,
  FaHistory,
  FaChartBar,
} from 'react-icons/fa';
import { VoiceParams } from '../types';
import { VoiceSample } from '../lib/voiceoverApi';
import LoadingSkeleton from './LoadingSkeleton';
import ModelSelector from './ModelSelector';
import DynamicParameterControls from './DynamicParameterControls';
import GenerationHistory from './GenerationHistory';
import { getModelDefinition, DEFAULT_MODEL_ID } from '../lib/tts/registry';

interface VoiceControlsProps {
  params: VoiceParams;
  onParamsChange: (params: VoiceParams) => void;
  apiVoices?: VoiceSample[];
  apiVoicesLoading?: boolean;
  apiVoicesError?: string | null;
  onApiVoiceChange?: (voiceId: string) => void;
  selectedApiVoice?: string;
  selectedModelId?: string;
  onModelChange?: (modelId: string) => void;
  onLoadPrompt?: (text: string) => void;
  refreshHistoryTrigger?: number;
}

// Language to country and code tag mapping
const LANGUAGE_META: Record<string, { country: string; code: string }> = {
  'en-US': { country: 'US', code: 'EN' },
  'en-GB': { country: 'UK', code: 'EN' },
  'es': { country: 'ES', code: 'ES' },
  'es-ES': { country: 'ES', code: 'ES' },
  'fr': { country: 'FR', code: 'FR' },
  'fr-FR': { country: 'FR', code: 'FR' },
  'hi': { country: 'IN', code: 'HI' },
  'it': { country: 'IT', code: 'IT' },
  'ja': { country: 'JP', code: 'JA' },
  'pt': { country: 'PT', code: 'PT' },
  'pt-BR': { country: 'BR', code: 'PT' },
  'zh': { country: 'CN', code: 'ZH' },
  'zh-CN': { country: 'CN', code: 'ZH' },
};

// Deterministic tone and stats generator based on voice ID
function getVoiceCardMeta(voice: VoiceSample) {
  const id = voice.voice_id.toLowerCase();

  // Country & Lang Code Resolution
  let langMeta = { country: 'US', code: 'EN' };
  if (id.startsWith('bf_') || id.startsWith('bm_')) {
    langMeta = { country: 'UK', code: 'EN' };
  } else if (id.startsWith('ef_') || id.startsWith('em_') || id.startsWith('es_')) {
    langMeta = { country: 'ES', code: 'ES' };
  } else if (id.startsWith('ff_')) {
    langMeta = { country: 'FR', code: 'FR' };
  } else if (id.startsWith('hf_') || id.startsWith('hm_')) {
    langMeta = { country: 'IN', code: 'HI' };
  } else if (id.startsWith('if_') || id.startsWith('im_')) {
    langMeta = { country: 'IT', code: 'IT' };
  } else if (id.startsWith('jf_') || id.startsWith('jm_')) {
    langMeta = { country: 'JP', code: 'JA' };
  } else if (id.startsWith('pf_') || id.startsWith('pm_')) {
    langMeta = { country: 'PT', code: 'PT' };
  } else if (id.startsWith('zf_') || id.startsWith('zm_')) {
    langMeta = { country: 'CN', code: 'ZH' };
  } else if (voice.language && LANGUAGE_META[voice.language]) {
    langMeta = LANGUAGE_META[voice.language];
  }

  // Tone / Style Tag
  let tone = 'Conversational';
  if (id.includes('bella') || id.includes('heart')) tone = 'Warm';
  else if (id.includes('adam') || id.includes('michael')) tone = 'Deep';
  else if (id.includes('sky') || id.includes('alex') || id.includes('puck'))
    tone = 'Young';
  else if (id.includes('nicole') || id.includes('sarah')) tone = 'Professional';
  else if (id.includes('george') || id.includes('fable')) tone = 'Authoritative';
  else if (id.includes('emma') || id.includes('isabella')) tone = 'Refined';
  else if (id.includes('santa')) tone = 'Festive';
  else if (id.includes('river') || id.includes('kore')) tone = 'Smooth';
  else if (id.includes('fenrir') || id.includes('onyx')) tone = 'Energetic';

  // Deterministic realistic usage & likes based on character code sum
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) % 10000;
  }
  const usageCount = `${(500 + (hash % 450) + ((hash % 99) / 100)).toFixed(2)} K`;
  const likesCount = `${(1.0 + ((hash % 85) / 100)).toFixed(2)} K`;

  // Avatar pastel background colors
  const avatarGradients = [
    'from-[#cbe7e3] via-[#e2f0d9] to-[#faedd0]',
    'from-[#fde2e4] via-[#fad2e1] to-[#e2ece9]',
    'from-[#dfe7fd] via-[#cddafd] to-[#f0efeb]',
    'from-[#d8e2dc] via-[#ffe5d9] to-[#ffcad4]',
    'from-[#eeddd3] via-[#f7d9c4] to-[#f2c6de]',
  ];
  const avatarGradient = avatarGradients[hash % avatarGradients.length];

  // Clean pure voice name without redundant parentheses
  const cleanName = voice.voice_name.split('(')[0].trim() || voice.voice_name;

  return {
    langMeta,
    tone,
    usageCount,
    likesCount,
    avatarGradient,
    cleanName,
  };
}

const VoiceControls = memo(function VoiceControls({
  params,
  onParamsChange,
  apiVoices = [],
  apiVoicesLoading = false,
  apiVoicesError = null,
  onApiVoiceChange,
  selectedApiVoice = '',
  selectedModelId = DEFAULT_MODEL_ID,
  onModelChange,
  onLoadPrompt,
  refreshHistoryTrigger = 0,
}: VoiceControlsProps) {
  const [activeTab, setActiveTab] = useState<'models' | 'history'>('models');
  const [historyCount, setHistoryCount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [likedVoices, setLikedVoices] = useState<Record<string, boolean>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentModelId = selectedModelId || params.modelId || DEFAULT_MODEL_ID;
  const currentModelDef = getModelDefinition(currentModelId);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleTogglePlaySample = (e: React.MouseEvent, voice: VoiceSample) => {
    e.stopPropagation();
    if (!voice.sample_url) return;

    if (playingVoiceId === voice.voice_id && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlayingVoiceId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    setPlaybackError(null);
    const audio = new Audio(voice.sample_url);
    audioRef.current = audio;
    setPlayingVoiceId(voice.voice_id);

    audio.play().catch((err) => {
      setPlayingVoiceId(null);
      setPlaybackError(`Sample playback failed: ${err.message}`);
    });

    audio.onended = () => {
      setPlayingVoiceId(null);
      setPlaybackError(null);
    };

    audio.onerror = () => {
      setPlayingVoiceId(null);
      setPlaybackError('Failed to load audio sample.');
    };
  };

  const handleToggleLike = (e: React.MouseEvent, voiceId: string) => {
    e.stopPropagation();
    setLikedVoices((prev) => ({
      ...prev,
      [voiceId]: !prev[voiceId],
    }));
  };

  const handleModelSelect = (newModelId: string) => {
    if (onModelChange) {
      onModelChange(newModelId);
    }
    const newModelDef = getModelDefinition(newModelId);
    onParamsChange({
      ...params,
      modelId: newModelId,
      options: {
        ...newModelDef.defaultParams,
      },
    });
  };

  const handleParamChange = (paramId: string, value: any) => {
    const updatedOptions = {
      ...(params.options || currentModelDef.defaultParams),
      [paramId]: value,
    };

    const updatedParams: VoiceParams = {
      ...params,
      modelId: currentModelId,
      options: updatedOptions,
    };

    if (paramId === 'speed' && typeof value === 'number') {
      updatedParams.rate = value;
    }
    if (paramId === 'pitch' && typeof value === 'number') {
      updatedParams.pitch = value;
    }
    if (paramId === 'volume' && typeof value === 'number') {
      updatedParams.volume = value;
    }

    onParamsChange(updatedParams);
  };

  const filteredVoices = apiVoices.filter((voice) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      voice.voice_name.toLowerCase().includes(query) ||
      (voice.language && voice.language.toLowerCase().includes(query)) ||
      (voice.accent && voice.accent.toLowerCase().includes(query)) ||
      (voice.gender && voice.gender.toLowerCase().includes(query))
    );
  });

  return (
    <div className="flex flex-col gap-3.5">
      {/* 1. Top Navigation Tabs: Voice & Model vs History */}
      <div className="flex p-1 bg-gray-100/90 rounded-2xl gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('models')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'models'
              ? 'bg-white text-gray-900 shadow-2xs'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <FaMicrophone className={activeTab === 'models' ? 'text-[#ff9b8f]' : 'text-gray-400'} />
          <span>Voice & Model</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'history'
              ? 'bg-white text-gray-900 shadow-2xs'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <FaHistory className={activeTab === 'history' ? 'text-[#ff9b8f]' : 'text-gray-400'} />
          <span>History</span>
          {historyCount > 0 && (
            <span className="px-1.5 py-0.2 bg-[#ff9b8f]/20 text-[#ff7d6e] rounded-full text-[10px] font-bold">
              {historyCount}
            </span>
          )}
        </button>
      </div>

      {/* 2. Tab Content: Voice & Model Controls */}
      {activeTab === 'models' ? (
        <div className="flex flex-col gap-3.5">
          {/* Model Selector Section */}
          <ModelSelector
            selectedModelId={currentModelId}
            onSelectModel={handleModelSelect}
          />

          {/* Voice Catalog Header & Search */}
          <div className="flex flex-col gap-2 pt-1 border-t border-gray-100">
            <div className="flex justify-between items-center">
              <label className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-800 uppercase tracking-wider">
                <FaMicrophone className="text-[#ff9b8f]" />
                Select Voice
              </label>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                {filteredVoices.length} {filteredVoices.length === 1 ? 'voice' : 'voices'}
              </span>
            </div>

            {/* Search Bar */}
            {apiVoices.length > 4 && (
              <div className="relative w-full">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search voices by name, accent, gender..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-[#ff9b8f] focus:bg-white focus:ring-2 focus:ring-[#ff9b8f]/20 transition-all text-gray-800"
                />
              </div>
            )}
          </div>

          {playbackError && (
            <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
              {playbackError}
            </div>
          )}

          {/* Modern Scrollable Voices List Cards */}
          {apiVoicesLoading ? (
            <LoadingSkeleton variant="voiceDropdown" />
          ) : apiVoicesError ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 text-center">
              ⚠️ {apiVoicesError}
            </div>
          ) : filteredVoices.length === 0 ? (
            <div className="p-5 bg-gray-50 border border-dashed border-gray-300 rounded-xl text-center text-xs text-gray-500">
              No voices match &quot;{searchQuery}&quot;
            </div>
          ) : (
            <div
              className="max-h-[300px] sm:max-h-[320px] overflow-y-auto space-y-2 pr-1.5 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent rounded-2xl border border-gray-100 p-1 bg-gray-50/50 transition-all duration-300 ease-in-out"
              tabIndex={0}
              aria-label="Scrollable voices list"
            >
              {filteredVoices.map((voice) => {
                const isSelected = voice.voice_id === selectedApiVoice;
                const isPlayingThis = playingVoiceId === voice.voice_id;
                const isLiked = !!likedVoices[voice.voice_id];
                const meta = getVoiceCardMeta(voice);
                const genderLabel =
                  voice.gender?.toLowerCase() === 'male' ? 'Male' : 'Female';

                return (
                  <div
                    key={voice.voice_id}
                    onClick={() => onApiVoiceChange && onApiVoiceChange(voice.voice_id)}
                    className={`group relative flex flex-col p-3.5 sm:p-4 rounded-2xl cursor-pointer transition-all duration-200 border ${
                      isSelected
                        ? 'bg-white border-[#ff9b8f] ring-2 ring-[#ff9b8f]/20 shadow-xs'
                        : 'bg-white/90 border-gray-100/90 hover:bg-white hover:border-gray-200 hover:shadow-2xs'
                    }`}
                  >
                    {/* Top Row: Avatar with Overlaid Play button + Title, Gender, Active pill + Radio Dot */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* Circular Avatar with embedded Play/Pause Button */}
                        <div className="relative flex-shrink-0">
                          <button
                            type="button"
                            onClick={(e) => handleTogglePlaySample(e, voice)}
                            aria-label={isPlayingThis ? 'Pause sample' : 'Play sample'}
                            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-sm text-gray-700 bg-gradient-to-tr ${meta.avatarGradient} shadow-2xs relative overflow-hidden group/btn cursor-pointer transition-transform hover:scale-105`}
                          >
                            <div className="absolute inset-0 bg-black/25 flex items-center justify-center transition-colors group-hover/btn:bg-black/35">
                              {isPlayingThis ? (
                                <FaPause className="text-white text-xs" />
                              ) : (
                                <FaPlay className="text-white text-xs ml-0.5" />
                              )}
                            </div>
                          </button>
                        </div>

                        {/* Title, Gender & Active Pill */}
                        <div className="flex flex-col min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm sm:text-base text-gray-900">
                              {meta.cleanName}
                            </span>
                            <span className="text-gray-400 text-xs">·</span>
                            <span className="text-gray-500 text-xs font-normal">
                              {genderLabel}
                            </span>
                            {isSelected && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-600 border border-red-100">
                                <FaCheck className="text-[9px]" />
                                <span>Active</span>
                              </span>
                            )}
                          </div>

                          {/* Description text */}
                          <p className="text-xs text-gray-500 mt-0.5 truncate">
                            {voice.description || `${meta.tone} ${genderLabel.toLowerCase()} voice`}
                          </p>
                        </div>
                      </div>

                      {/* Top Right: Radio selection dot indicator */}
                      <div className="flex-shrink-0 pt-0.5">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                            isSelected
                              ? 'border-[#ff9b8f] bg-white'
                              : 'border-gray-200 bg-transparent group-hover:border-gray-300'
                          }`}
                        >
                          {isSelected && (
                            <div className="w-2.5 h-2.5 rounded-full bg-[#ff9b8f]" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Middle Row: Chips / Badges (Country • Lang, Gender, Tone) */}
                    <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100/80 text-gray-700">
                        {meta.langMeta.country} • {meta.langMeta.code}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-gray-100/80 text-gray-700">
                        {genderLabel}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-gray-100/80 text-gray-700">
                        {meta.tone}
                      </span>
                    </div>

                    {/* Bottom Row: Stats (Usage Count & Likes Count) */}
                    <div className="flex items-center gap-3 mt-3 pt-2 text-[11px] text-gray-500 font-medium border-t border-gray-50">
                      <div className="flex items-center gap-1.5">
                        <FaChartBar className="text-gray-400 text-xs" />
                        <span>{meta.usageCount}</span>
                      </div>
                      <span className="text-gray-300">|</span>
                      <button
                        type="button"
                        onClick={(e) => handleToggleLike(e, voice.voice_id)}
                        className="flex items-center gap-1.5 hover:text-red-500 transition-colors cursor-pointer"
                      >
                        {isLiked ? (
                          <FaHeart className="text-red-500 text-xs" />
                        ) : (
                          <FaRegHeart className="text-gray-400 hover:text-red-400 text-xs" />
                        )}
                        <span>{meta.likesCount}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Dynamic Model Parameter Controls */}
          <DynamicParameterControls
            model={currentModelDef}
            params={params.options || currentModelDef.defaultParams}
            onParamChange={handleParamChange}
          />
        </div>
      ) : (
        /* Tab Content: Generation History */
        <GenerationHistory
          onLoadPrompt={onLoadPrompt}
          onHistoryCountChange={setHistoryCount}
          refreshTrigger={refreshHistoryTrigger}
        />
      )}
    </div>
  );
});

export default VoiceControls;
