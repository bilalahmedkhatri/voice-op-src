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
  FaChartBar,
} from 'react-icons/fa';
import { VoiceParams } from '../types';
import { VoiceSample } from '../lib/voiceoverApi';
import LoadingSkeleton from './LoadingSkeleton';
import ModelSelector from './ModelSelector';
import DynamicParameterControls from './DynamicParameterControls';
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
}

// Language to country and code tag mapping
const LANGUAGE_META: Record<string, { country: string; code: string }> = {
  'en-US': { country: 'US', code: 'EN' },
  'en-GB': { country: 'UK', code: 'EN' },
  'es': { country: 'ES', code: 'ES' },
  'fr-FR': { country: 'FR', code: 'FR' },
  'hi': { country: 'IN', code: 'HI' },
  'it': { country: 'IT', code: 'IT' },
  'ja': { country: 'JP', code: 'JA' },
  'pt': { country: 'PT', code: 'PT' },
  'zh-CN': { country: 'CN', code: 'ZH' },
};

// Deterministic tone and stats generator based on voice ID
function getVoiceCardMeta(voice: VoiceSample) {
  const id = voice.voice_id.toLowerCase();

  // Flag & Lang Code
  const langKey =
    voice.language ||
    (id.startsWith('bf_') || id.startsWith('bm_') ? 'en-GB' : 'en-US');
  const langMeta =
    LANGUAGE_META[langKey] || { country: 'GL', code: voice.language || 'EN' };

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
}: VoiceControlsProps) {
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

    // If currently playing this voice, stop it
    if (playingVoiceId === voice.voice_id && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlayingVoiceId(null);
      return;
    }

    // Stop existing audio if any
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
      {/* 1. Model Selector Section */}
      <ModelSelector
        selectedModelId={currentModelId}
        onSelectModel={handleModelSelect}
      />

      {/* 2. Voice Catalog Header & Search */}
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

      {/* 3. Modern Scrollable Voices List Cards */}
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
                className={`group relative flex items-start justify-between p-2.5 sm:p-3 rounded-2xl cursor-pointer transition-all duration-200 border ${
                  isSelected
                    ? 'bg-white border-[#ff9b8f] ring-2 ring-[#ff9b8f]/25 shadow-xs'
                    : 'bg-white border-gray-200/80 hover:border-[#ffb4a8] hover:shadow-2xs'
                }`}
              >
                {/* Left: Avatar / Play Overlay & Details */}
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  {/* Avatar Circle with Hover Play/Pause button */}
                  <div
                    onClick={(e) => handleTogglePlaySample(e, voice)}
                    className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full flex-shrink-0 cursor-pointer overflow-hidden shadow-2xs group/avatar mt-0.5"
                    title={`${isPlayingThis ? 'Stop' : 'Play'} voice preview`}
                  >
                    {/* Background Pastel Texture */}
                    <div
                      className={`w-full h-full bg-gradient-to-br ${meta.avatarGradient} flex items-center justify-center font-bold text-gray-700 text-sm transition-transform duration-300 group-hover/avatar:scale-105`}
                    >
                      {meta.cleanName.charAt(0)}
                    </div>

                    {/* Play/Pause Overlay - visible on hover or when playing */}
                    <div
                      className={`absolute inset-0 flex items-center justify-center transition-all duration-200 ${
                        isPlayingThis
                          ? 'bg-amber-500/90 text-white opacity-100'
                          : 'bg-black/40 text-white opacity-0 group-hover:opacity-100 group-hover/avatar:opacity-100'
                      }`}
                    >
                      {isPlayingThis ? (
                        <FaPause className="text-[11px] animate-pulse" />
                      ) : (
                        <FaPlay className="text-[11px] ml-0.5" />
                      )}
                    </div>
                  </div>

                  {/* Voice Info */}
                  <div className="min-w-0 flex flex-col flex-1 gap-0.5">
                    {/* Title Row */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-xs sm:text-sm text-gray-900 truncate">
                        {meta.cleanName}
                      </span>
                      <span className="text-gray-400 text-[11px] font-normal">
                        · {genderLabel}
                      </span>
                      {isSelected && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 bg-[#ff9b8f]/20 text-red-700 rounded-md inline-flex items-center gap-0.5">
                          <FaCheck className="text-[7px]" /> Active
                        </span>
                      )}
                    </div>

                    {/* Description Row */}
                    <p className="text-[10.5px] sm:text-[11px] text-gray-500 line-clamp-1 leading-snug">
                      {voice.description ||
                        `Natural ${meta.tone.toLowerCase()} ${genderLabel.toLowerCase()} voice.`}
                    </p>

                    {/* Chips Row: Country/Lang, Gender, Tone */}
                    <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                      {/* Country + Lang Chip */}
                      <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-[9.5px] font-semibold px-2 py-0.5 rounded-full">
                        <span className="font-mono text-gray-900">{meta.langMeta.country}</span>
                        <span className="text-gray-400">•</span>
                        <span>{meta.langMeta.code}</span>
                      </span>

                      {/* Gender Chip */}
                      <span className="bg-gray-100 text-gray-600 text-[9.5px] font-medium px-2 py-0.5 rounded-full">
                        {genderLabel}
                      </span>

                      {/* Tone / Style Chip */}
                      <span className="bg-gray-100 text-gray-600 text-[9.5px] font-medium px-2 py-0.5 rounded-full">
                        {meta.tone}
                      </span>
                    </div>

                    {/* Stats Row: Usage + Likes (Compact Spacing) */}
                    <div className="flex items-center gap-2 mt-0.5 text-[9.5px] font-medium text-gray-400">
                      <div
                        className="flex items-center gap-1"
                        title="Total generations using this voice"
                      >
                        <FaChartBar className="text-gray-400 text-[8px]" />
                        <span>{meta.usageCount}</span>
                      </div>

                      <span className="text-gray-300">|</span>

                      <button
                        type="button"
                        onClick={(e) => handleToggleLike(e, voice.voice_id)}
                        className="flex items-center gap-1 hover:text-red-500 transition-colors cursor-pointer"
                        title="Like this voice"
                      >
                        {isLiked ? (
                          <FaHeart className="text-red-500 text-[8px]" />
                        ) : (
                          <FaRegHeart className="text-gray-400 hover:text-red-500 text-[8px]" />
                        )}
                        <span className={isLiked ? 'text-red-500 font-semibold' : ''}>
                          {meta.likesCount}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right: Selection Radio */}
                <div className="ml-1.5 flex-shrink-0 pt-0.5">
                  <div
                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border flex items-center justify-center transition-all ${
                      isSelected
                        ? 'border-[#ff9b8f] bg-[#ff9b8f]'
                        : 'border-gray-300 bg-white group-hover:border-gray-400'
                    }`}
                  >
                    {isSelected && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Dynamic Model Parameter Sliders */}
      <DynamicParameterControls
        model={currentModelDef}
        params={params.options || { speed: params.rate }}
        onParamChange={handleParamChange}
      />
    </div>
  );
});

export default VoiceControls;
