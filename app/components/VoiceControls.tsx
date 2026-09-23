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
  FaBookmark,
  FaTimes,
  FaSlidersH,
  FaSync,
} from 'react-icons/fa';
import { VoiceParams } from '../types';
import { VoiceSample } from '../lib/voiceoverApi';
import { VoicePresetItem } from '../lib/localPresetStorage';
import LoadingSkeleton from './LoadingSkeleton';
import ModelSelector from './ModelSelector';
import DynamicParameterControls from './DynamicParameterControls';
import GenerationHistory from './GenerationHistory';
import { TTSModel } from '../hooks/useModels';

interface VoiceControlsProps {
  params: VoiceParams;
  onParamsChange: (params: VoiceParams) => void;
  apiModels?: TTSModel[];
  apiModelsLoading?: boolean;
  apiVoices?: VoiceSample[];
  apiVoicesLoading?: boolean;
  apiVoicesError?: string | null;
  apiVoicesSearch?: string;
  setApiVoicesSearch?: (query: string) => void;
  apiVoicesLoadingMore?: boolean;
  apiVoicesHasMore?: boolean;
  apiVoicesLoadMore?: () => void;
  onApiVoiceChange?: (voiceId: string) => void;
  selectedApiVoice?: string;
  selectedModelId?: string;
  onModelChange?: (modelId: string) => void;
  onLoadPrompt?: (text: string) => void;
  refreshHistoryTrigger?: number;
  presets?: VoicePresetItem[];
  onApplyPreset?: (preset: VoicePresetItem) => void;
  onDeletePreset?: (presetId: string) => void;
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
  apiModels = [],
  apiModelsLoading = false,
  apiVoices = [],
  apiVoicesLoading = false,
  apiVoicesError = null,
  apiVoicesSearch = '',
  setApiVoicesSearch,
  apiVoicesLoadingMore = false,
  apiVoicesHasMore = false,
  apiVoicesLoadMore,
  onApiVoiceChange,
  selectedApiVoice = '',
  selectedModelId = '',
  onModelChange,
  onLoadPrompt,
  refreshHistoryTrigger = 0,
  presets = [],
  onApplyPreset,
  onDeletePreset,
}: VoiceControlsProps) {
  const [activeTab, setActiveTab] = useState<'models' | 'history'>('models');
  const [historyCount, setHistoryCount] = useState<number>(0);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [loadingVoiceId, setLoadingVoiceId] = useState<string | null>(null);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [likedVoices, setLikedVoices] = useState<Record<string, boolean>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentModelId = selectedModelId || params.modelId || (apiModels.length > 0 ? apiModels[0].name : '');
  const currentModelDef = apiModels.find(m => m.name === currentModelId);

  const stopCurrentAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
      audioRef.current.load();
      audioRef.current = null;
    }
    setPlayingVoiceId(null);
    setLoadingVoiceId(null);
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      stopCurrentAudio();
    };
  }, []);

  const handleTogglePlaySample = (e: React.MouseEvent, voice: VoiceSample) => {
    e.stopPropagation();
    if (!voice.sample_url) return;

    // 1. If currently playing or loading this voice, stop/pause it immediately
    if (playingVoiceId === voice.voice_id || loadingVoiceId === voice.voice_id) {
      stopCurrentAudio();
      return;
    }

    // 2. Stop any other audio that might be playing
    stopCurrentAudio();
    setPlaybackError(null);
    setLoadingVoiceId(voice.voice_id);

    // 3. Create fresh Audio instance
    const audio = new Audio(voice.sample_url);
    audioRef.current = audio;

    const handlePlayingState = () => {
      if (audioRef.current === audio && !audio.paused) {
        setLoadingVoiceId(null);
        setPlayingVoiceId(voice.voice_id);
      }
    };

    audio.onplaying = handlePlayingState;

    audio.onended = () => {
      if (audioRef.current === audio) {
        stopCurrentAudio();
      }
    };

    audio.onerror = () => {
      if (audioRef.current === audio) {
        stopCurrentAudio();
        setPlaybackError('Failed to load audio sample.');
      }
    };

    audio.play().then(() => {
      handlePlayingState();
    }).catch((err) => {
      if (err.name === 'AbortError') {
        // Paused intentionally before playback started
        return;
      }
      if (audioRef.current === audio) {
        stopCurrentAudio();
        setPlaybackError(`Sample playback failed: ${err.message}`);
      }
    });
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
    onParamsChange({
      ...params,
      modelId: newModelId,
      options: {},
    });
  };

  const handleParamChange = (paramId: string, value: any) => {
    const updatedOptions = {
      ...(params.options || {}),
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
            apiModels={apiModels}
            apiModelsLoading={apiModelsLoading}
          />

          {/* Saved Presets Bar */}
          {presets && presets.length > 0 && (
            <div className="flex flex-col gap-1.5 p-2.5 bg-amber-50/70 rounded-2xl border border-amber-200/60 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                  <FaBookmark className="text-amber-500 text-[10px]" />
                  Saved Voice Presets ({presets.length})
                </span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-thin">
                {presets.map((preset) => {
                  const isActive =
                    preset.voice_id === selectedApiVoice &&
                    preset.model_id === currentModelId;
                  const speedVal = preset.parameters?.speed || preset.parameters?.rate;
                  return (
                    <div
                      key={preset.id}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold cursor-pointer transition-all flex-shrink-0 border ${
                        isActive
                          ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                          : 'bg-white text-gray-800 border-amber-200 hover:border-amber-300 shadow-2xs'
                      }`}
                      onClick={() => onApplyPreset && onApplyPreset(preset)}
                    >
                      <span>{preset.preset_name || preset.voice_name}</span>
                      {speedVal && (
                        <span
                          className={`text-[9px] px-1 rounded font-mono ${
                            isActive ? 'bg-amber-600 text-amber-100' : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {speedVal}x
                        </span>
                      )}
                      {onDeletePreset && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeletePreset(preset.id);
                          }}
                          className={`p-0.5 rounded hover:bg-black/10 transition-colors ml-0.5 ${
                            isActive ? 'text-white' : 'text-gray-400 hover:text-red-500'
                          }`}
                          title="Delete preset"
                        >
                          <FaTimes className="text-[8px]" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Voice Catalog Header & Search */}
          <div className="flex flex-col gap-2 pt-1 border-t border-gray-100">
            <div className="flex justify-between items-center">
              <label className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-800 uppercase tracking-wider">
                <FaMicrophone className="text-[#ff9b8f]" />
                Select Voice
              </label>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                {apiVoices.length} {apiVoices.length === 1 ? 'voice' : 'voices'} loaded
              </span>
            </div>

            {/* Search Bar */}
            <div className="relative w-full">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />
              <input
                type="text"
                placeholder="Search voices by name, accent, gender..."
                value={apiVoicesSearch}
                onChange={(e) => setApiVoicesSearch?.(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-[#ff9b8f] focus:bg-white focus:ring-2 focus:ring-[#ff9b8f]/20 transition-all text-gray-800"
              />
            </div>
          </div>

          {playbackError && (
            <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
              {playbackError}
            </div>
          )}

          {apiVoicesLoading && !apiVoices.length ? (
            <LoadingSkeleton variant="voiceList" />
          ) : apiVoicesError ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 text-center">
              ⚠️ {apiVoicesError}
            </div>
          ) : apiVoices.length === 0 ? (
            <div className="p-5 bg-gray-50 border border-dashed border-gray-300 rounded-xl text-center text-xs text-gray-500">
              No voices match &quot;{apiVoicesSearch}&quot;
            </div>
          ) : (
            <div
              className="max-h-[300px] sm:max-h-[320px] overflow-y-auto space-y-2 pr-1.5 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent rounded-2xl border border-gray-100 p-1 bg-gray-50/50 transition-all duration-300 ease-in-out"
              tabIndex={0}
              aria-label="Scrollable voices list"
            >
              {apiVoices.map((voice) => {
                const isSelected = voice.voice_id === selectedApiVoice;
                const isPlayingThis = playingVoiceId === voice.voice_id;
                const isLoadingThis = loadingVoiceId === voice.voice_id;
                const isLiked = !!likedVoices[voice.voice_id];
                const meta = getVoiceCardMeta(voice);
                const genderLabel =
                  voice.gender?.toLowerCase() === 'male' ? 'Male' : 'Female';

                return (
                  <div
                    key={voice.voice_id}
                    onClick={() => onApiVoiceChange && onApiVoiceChange(voice.voice_id)}
                    className={`group relative flex items-center justify-between p-1.5 sm:p-3 rounded-xl sm:rounded-2xl cursor-pointer transition-all duration-200 border ${
                      isSelected
                        ? 'bg-white border-[#ff9b8f] ring-1 sm:ring-2 ring-[#ff9b8f]/20 shadow-xs'
                        : 'bg-white/90 border-gray-100/90 hover:bg-white hover:border-gray-200 hover:shadow-2xs'
                    }`}
                  >
                    {/* Left: Avatar & Info */}
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      {/* Avatar with dynamic initials & gradient */}
                      <div
                        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-[10px] sm:text-sm text-gray-700 bg-gradient-to-tr ${meta.avatarGradient} flex-shrink-0 shadow-2xs ${
                          isLoadingThis ? 'animate-pulse ring-2 ring-[#ff9b8f]/60' : ''
                        }`}
                      >
                        {isLoadingThis ? (
                          <FaSync className="text-[10px] sm:text-xs animate-spin text-gray-800" />
                        ) : (
                          meta.cleanName.substring(0, 2).toUpperCase()
                        )}
                      </div>

                      {/* Info & Badges */}
                      <div className="flex flex-col min-w-0 flex-1">
                        {/* Top Line: Name + Lang Tag + Tone */}
                        <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                          <span className="font-bold text-[11px] sm:text-sm text-gray-900 truncate max-w-[120px] sm:max-w-[200px]">
                            {meta.cleanName}
                          </span>
                          <span className="px-1 sm:px-1.5 py-0.5 rounded text-[8px] sm:text-[10px] font-semibold bg-gray-100 text-gray-600 border border-gray-200/60 flex-shrink-0">
                            {meta.langMeta.code}
                          </span>
                          <span className="px-1 sm:px-1.5 py-0.5 rounded text-[8px] sm:text-[10px] font-medium bg-red-50 text-red-700 border border-red-100/80 flex-shrink-0 truncate">
                            {meta.tone}
                          </span>
                        </div>

                        {/* Subtitle Line: Gender • Accent • Usage count */}
                        <div className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-[11px] text-gray-500 mt-0.5 flex-wrap">
                          <span className="flex-shrink-0">{genderLabel}</span>
                          <span className="text-gray-300 flex-shrink-0">•</span>
                          <span className="truncate max-w-[80px] sm:max-w-none">{voice.accent || 'Natural'}</span>
                          <span className="text-gray-300 flex-shrink-0">•</span>
                          <span className="text-gray-400 font-medium flex-shrink-0">{meta.usageCount} uses</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions (Play Preview, Like with Count, Selection Check) */}
                    <div className="flex items-center gap-1 sm:gap-2 ml-1 sm:ml-2 flex-shrink-0">
                      {voice.sample_url && (
                        <button
                          type="button"
                          onClick={(e) => handleTogglePlaySample(e, voice)}
                          aria-label={
                            isLoadingThis
                              ? 'Loading sample...'
                              : isPlayingThis
                              ? 'Pause sample'
                              : 'Play sample'
                          }
                          className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all cursor-pointer flex-shrink-0 ${
                            isLoadingThis
                              ? 'bg-amber-50 text-amber-600 border border-amber-300/80 ring-1 sm:ring-2 ring-amber-300/30'
                              : isPlayingThis
                              ? 'bg-[#ff9b8f] text-white shadow-xs scale-105 animate-pulse'
                              : 'bg-gray-100 hover:bg-[#ff9b8f]/20 text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          {isLoadingThis ? (
                            <FaSync className="text-[8px] sm:text-[10px] animate-spin text-amber-600" />
                          ) : isPlayingThis ? (
                            <FaPause className="text-[8px] sm:text-[10px]" />
                          ) : (
                            <FaPlay className="text-[8px] sm:text-[10px] ml-0.5" />
                          )}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={(e) => handleToggleLike(e, voice.voice_id)}
                        aria-label={isLiked ? 'Unlike' : 'Like'}
                        className="flex items-center gap-0.5 sm:gap-1 px-1 sm:px-1.5 py-1 rounded-full text-gray-400 hover:text-red-500 transition-colors cursor-pointer flex-shrink-0"
                      >
                        {isLiked ? (
                          <FaHeart className="text-red-500 text-[10px] sm:text-xs" />
                        ) : (
                          <FaRegHeart className="text-gray-400 hover:text-red-400 text-[10px] sm:text-xs" />
                        )}
                        <span className="text-[8px] sm:text-[10px] font-medium text-gray-500">{meta.likesCount}</span>
                      </button>

                      {isSelected && (
                        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#ff9b8f] text-white flex items-center justify-center ml-0.5 flex-shrink-0">
                          <FaCheck className="text-[7px] sm:text-[9px]" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Load More Button */}
              {apiVoicesHasMore && (
                <div className="pt-2 pb-1 flex justify-center">
                  <button
                    type="button"
                    onClick={() => apiVoicesLoadMore?.()}
                    disabled={apiVoicesLoadingMore}
                    className="px-4 py-1.5 rounded-full text-xs font-bold text-[#ff9b8f] bg-[#ff9b8f]/10 hover:bg-[#ff9b8f]/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {apiVoicesLoadingMore ? (
                      <><FaSync className="animate-spin text-xs" /> Loading...</>
                    ) : (
                      'Load More'
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Dynamic Model Parameter Controls */}
          {currentModelDef && (
            <DynamicParameterControls
              model={currentModelDef}
              params={params.options || {}}
              onParamChange={handleParamChange}
            />
          )}
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
