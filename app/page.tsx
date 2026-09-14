'use client';

import { FaMicrophone, FaSync, FaGoogle, FaLock } from 'react-icons/fa';
import { useVoiceGenerator } from './hooks/useVoiceGenerator';
import { useVoiceSamples } from './hooks/useVoiceSamples';
import { useModels, TTSModel } from './hooks/useModels';
import TextInput from './components/TextInput';
import VoiceControls from './components/VoiceControls';
import AudioPlayer from './components/AudioPlayer';
import GenerationStatus from './components/GenerationStatus';
import Footer from './Footer';
import { designSystem as ds } from './lib/designSystem';
import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useIsClient } from './hooks/useIsClient';
import LoadingSkeleton from './components/LoadingSkeleton';
import AuthButton from './components/AuthButton';
import {
  VoicePresetItem,
  getLocalPresets,
  saveLocalPreset,
  deleteLocalPreset,
} from './lib/localPresetStorage';
import FormatSelectionModal, { VideoFormat } from './components/FormatSelectionModal';

const SavedPrompts = lazy(() => import('./components/SavedPrompts'));

export default function Home() {
  const {
    params,
    setParams,
    savedPrompts,
    audioBlob,
    handleGenerate,
    handleSavePrompt,
    loadPrompt,
    deletePrompt,
    videoFormat,
    isGenerating,
    generationTime,
    errorMessage,
    dismissError,
    userQuota,
    isAuthenticated,
    isOnlineDb,
    remainingGenerations,
  } = useVoiceGenerator();

  const { models: apiModels, loading: apiModelsLoading } = useModels();
  const [selectedModelId, setSelectedModelId] = useState('');
  const { 
    voices: apiVoices, 
    loading: apiVoicesLoading, 
    error: apiVoicesError,
    searchQuery: apiVoicesSearch,
    setSearchQuery: setApiVoicesSearch,
    loadingMore: apiVoicesLoadingMore,
    hasMore: apiVoicesHasMore,
    loadMore: apiVoicesLoadMore,
  } = useVoiceSamples(selectedModelId);
  const [selectedApiVoice, setSelectedApiVoice] = useState('');
  const [presets, setPresets] = useState<VoicePresetItem[]>([]);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [isFormatModalOpen, setIsFormatModalOpen] = useState(false);
  const isClient = useIsClient();

  // Load Presets (both online DB and local IndexedDB)
  const refreshPresets = useCallback(async () => {
    try {
      if (isOnlineDb && isAuthenticated) {
        const res = await fetch('/api/presets');
        const data = await res.json();
        if (data.presets && Array.isArray(data.presets)) {
          setPresets(data.presets);
          return;
        }
      }
      const local = await getLocalPresets();
      setPresets(local);
    } catch {
      const local = await getLocalPresets().catch(() => []);
      setPresets(local);
    }
  }, [isOnlineDb, isAuthenticated]);

  useEffect(() => {
    refreshPresets();
  }, [refreshPresets]);

  // Auto-select first model once models are loaded if none currently selected
  useEffect(() => {
    if (!selectedModelId && apiModels.length > 0) {
      setSelectedModelId(apiModels[0].name);
    }
  }, [apiModels, selectedModelId]);

  // Auto-select first voice once voices are loaded if none currently selected
  useEffect(() => {
    if (!selectedApiVoice && apiVoices.length > 0) {
      setSelectedApiVoice(apiVoices[0].voice_id);
    }
  }, [apiVoices, selectedApiVoice]);

  const handleModelChange = (newModelId: string) => {
    setSelectedModelId(newModelId);
    setSelectedApiVoice(''); // Reset selected voice on model switch
  };

  const handleApplyPreset = (preset: VoicePresetItem) => {
    setSelectedModelId(preset.model_id);
    setSelectedApiVoice(preset.voice_id);
    const speed = preset.parameters?.speed || preset.parameters?.rate || params.rate;
    setParams((prev) => ({
      ...prev,
      modelId: preset.model_id,
      voice: preset.voice_id,
      rate: typeof speed === 'number' ? speed : prev.rate,
      options: {
        ...(prev.options || {}),
        ...(preset.parameters || {}),
      },
    }));
  };

  const handleSavePreset = async (presetName?: string): Promise<boolean> => {
    const selectedVoiceObj = apiVoices.find((v) => v.voice_id === selectedApiVoice);
    const voiceName = selectedVoiceObj?.voice_name.split('(')[0].trim() || selectedApiVoice || 'Custom Voice';
    const name = presetName || `${voiceName} Preset`;
    const presetParams = params.options || { speed: params.rate };

    try {
      // 1. Save locally to IndexedDB
      await saveLocalPreset({
        preset_name: name,
        model_id: selectedModelId,
        voice_id: selectedApiVoice,
        voice_name: voiceName,
        language: selectedVoiceObj?.language || 'EN',
        gender: selectedVoiceObj?.gender || 'Female',
        parameters: presetParams,
      });

      // 2. If online and logged in, sync to Neon DB
      if (isOnlineDb && isAuthenticated) {
        await fetch('/api/presets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            preset_name: name,
            model_id: selectedModelId,
            voice_id: selectedApiVoice,
            voice_name: voiceName,
            language: selectedVoiceObj?.language || 'EN',
            gender: selectedVoiceObj?.gender || 'Female',
            parameters: presetParams,
          }),
        });
      }

      await refreshPresets();
      return true;
    } catch (e) {
      console.error('Failed to save preset:', e);
      return false;
    }
  };

  const handleDeletePreset = async (presetId: string) => {
    try {
      await deleteLocalPreset(presetId);
      if (isOnlineDb && isAuthenticated) {
        await fetch(`/api/presets?id=${presetId}`, { method: 'DELETE' });
      }
      await refreshPresets();
    } catch (e) {
      console.error('Failed to delete preset:', e);
    }
  };

  const features = [
    { text: 'Instant Generation' },
    { text: 'Voice Customization' },
    { text: 'Save Prompts' },
  ];

  const handleGenerateClick = () => {
    if (isOnlineDb && !isAuthenticated) {
      window.location.href = '/api/auth/google';
      return;
    }
    if (!params.text.trim()) {
      handleGenerate(selectedApiVoice || undefined, selectedModelId);
      return;
    }
    // Open sleek format selection popup
    setIsFormatModalOpen(true);
  };

  const handleConfirmFormat = async (format: VideoFormat) => {
    setIsFormatModalOpen(false);
    await handleGenerate(selectedApiVoice || undefined, selectedModelId, format);
    setHistoryRefreshKey((prev) => prev + 1);
  };

  const isAuthRequired = isOnlineDb && !isAuthenticated;
  const isLimitReached = isOnlineDb && isAuthenticated && remainingGenerations !== null && remainingGenerations <= 0;

  const selectedVoiceObj = apiVoices.find((v) => v.voice_id === selectedApiVoice);
  const activeVoiceMeta = selectedVoiceObj
    ? {
        voice_id: selectedVoiceObj.voice_id,
        voice_name: selectedVoiceObj.voice_name.split('(')[0].trim() || selectedVoiceObj.voice_name,
        language: selectedVoiceObj.language,
        gender: selectedVoiceObj.gender,
        model_id: selectedModelId,
      }
    : null;

  return (
    <>
      <main className="min-h-screen bg-gradient-to-br from-red-50 via-red-100 via-red-200 to-red-300 relative">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-red-200 to-red-300 text-gray-900 px-4 sm:px-8 md:px-16 pt-8 pb-8 sm:pt-10 sm:pb-12 md:pt-12 md:pb-14 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-transparent" />

          <div className="max-w-7xl mx-auto relative z-10 px-4 sm:px-8 md:px-16 flex flex-col items-center">
            {/* Centered Google Auth Button at Top */}
            <div className="mb-6 flex justify-center">
              <AuthButton />
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-4 text-gray-900 tracking-tight">
              AI Voiceover Generator
            </h1>
            <p className="text-base sm:text-lg max-w-3xl mx-auto mb-8 text-gray-800 leading-relaxed font-normal px-4">
              Instantly transform text into high-quality, natural-sounding speech with our free AI Voice Generator.
              Perfect for content creators, educators, and developers, our advanced text-to-speech (TTS) tool offers a seamless experience with customizable voice parameters.
              Start creating professional voiceovers in seconds—no sign-up required.
            </p>

            {/* Feature Pills */}
            <div className="flex gap-4 justify-center flex-wrap mt-2">
              {features.map((feature) => (
                <div
                  key={feature.text}
                  className="py-1.5 px-4 bg-[#ff9b8f]/25 rounded-full text-sm font-medium border border-[#ff9b8f]/35 text-gray-900 shadow-xs"
                >
                  {feature.text}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Main Content */}
        <div className="max-w-screen-2xl mx-auto p-4 sm:p-8 md:p-16">
          {/* Generator Section */}
          <section
            aria-label="Voiceover generation controls"
            className="bg-white rounded-2xl p-4 sm:p-6 md:p-8 shadow-md mb-6 sm:mb-8 md:mb-12"
          >
            {/* ElevenLabs-style Split Workspace Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch mb-8">
              {/* Left Column: Text Input */}
              <div className="lg:col-span-7 flex flex-col">
                <TextInput
                  text={params.text}
                  onTextChange={(text) => setParams({ ...params, text })}
                  onSave={handleSavePrompt}
                  disabled={isLimitReached}
                />
              </div>

              {/* Right Column: Scrollable Playable Voices & Parameters */}
              <div className="lg:col-span-5 flex flex-col bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-xs">
                <section aria-label="Voice parameters">
                  <h3 className="sr-only">Adjust Voice Parameters</h3>
                  <VoiceControls
                    params={params}
                    onParamsChange={setParams}
                    apiModels={apiModels}
                    apiModelsLoading={apiModelsLoading}
                    apiVoices={apiVoices}
                    apiVoicesLoading={apiVoicesLoading}
                    apiVoicesError={apiVoicesError}
                    apiVoicesSearch={apiVoicesSearch}
                    setApiVoicesSearch={setApiVoicesSearch}
                    apiVoicesLoadingMore={apiVoicesLoadingMore}
                    apiVoicesHasMore={apiVoicesHasMore}
                    apiVoicesLoadMore={apiVoicesLoadMore}
                    onApiVoiceChange={setSelectedApiVoice}
                    selectedApiVoice={selectedApiVoice}
                    selectedModelId={selectedModelId}
                    onModelChange={handleModelChange}
                    onLoadPrompt={loadPrompt}
                    refreshHistoryTrigger={historyRefreshKey}
                    presets={presets}
                    onApplyPreset={handleApplyPreset}
                    onDeletePreset={handleDeletePreset}
                  />
                </section>
              </div>
            </div>

            {/* Bottom Actions & Player Area */}
            <div className="flex flex-col gap-4 pt-4 border-t border-gray-100">
              {/* Toolbar: Usage Badge & Compact Generate Button */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/80 p-3 sm:p-3.5 rounded-2xl border border-gray-100">
                {/* Usage / Quota Status Badge */}
                {isClient ? (
                  isAuthenticated && remainingGenerations !== null ? (
                    <div
                      className={`text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1.5 ${
                        isLimitReached
                          ? 'bg-red-50 border border-red-200 text-red-600'
                          : 'bg-white border border-gray-200/80 text-gray-700 shadow-2xs'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isLimitReached ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'
                        }`}
                      />
                      <span>
                        <strong>Free Studio Plan</strong> • {remainingGenerations} generation{remainingGenerations !== 1 ? 's' : ''} left today
                      </span>
                    </div>
                  ) : (
                    <div className="text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1.5 bg-white border border-gray-200/80 text-emerald-700 shadow-2xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>Free Studio Plan</span>
                    </div>
                  )
                ) : (
                  <div className="h-7 w-32 bg-gray-100 animate-pulse rounded-xl" />
                )}

                {/* Compact Generate Button */}
                {isAuthRequired ? (
                  <a
                    href="/api/auth/google"
                    className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-[#ff9b8f] to-[#ffb4a8] hover:from-[#f8887a] hover:to-[#ffa79a] text-white rounded-xl text-sm font-bold cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md hover:scale-[1.02] flex items-center justify-center gap-2"
                  >
                    <FaGoogle className="text-xs" />
                    <span>Sign in to Generate</span>
                  </a>
                ) : (
                  <button
                    onClick={handleGenerateClick}
                    disabled={!params.text.trim() || isGenerating || isLimitReached}
                    className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-[#ff9b8f] to-[#ffb4a8] hover:from-[#f8887a] hover:to-[#ffa79a] text-white rounded-xl text-sm font-bold cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md hover:scale-[1.02] disabled:bg-gray-200 disabled:from-gray-200 disabled:to-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed disabled:shadow-none disabled:scale-100 flex items-center justify-center gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <FaSync className="animate-spin text-xs" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <FaMicrophone className="text-xs" />
                        <span>Generate Voiceover</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <GenerationStatus
                errorMessage={errorMessage}
                onDismissError={dismissError}
              />

              <AudioPlayer
                audioUrl={null}
                audioBlob={audioBlob}
                isGenerating={isGenerating}
                generationTime={generationTime}
                videoFormat={videoFormat}
                activeVoiceMeta={activeVoiceMeta}
                activeParameters={params.options || { speed: params.rate }}
                onSavePreset={handleSavePreset}
              />
            </div>
          </section>

          {/* Format Selection Modal Popup */}
          <FormatSelectionModal
            isOpen={isFormatModalOpen}
            onClose={() => setIsFormatModalOpen(false)}
            onSelectFormat={handleConfirmFormat}
            text={params.text}
            isGenerating={isGenerating}
          />

          {/* Saved Prompts Section */}
          {isClient && savedPrompts.length > 0 && (
            <Suspense fallback={
              <section style={{
                background: 'white',
                borderRadius: ds.borderRadius['2xl'],
                padding: 'clamp(1.5rem, 4vw, 3rem)',
                boxShadow: ds.shadows.md,
              }}>
                <LoadingSkeleton variant="savedPrompts" />
              </section>
            }>
              <section className="bg-white rounded-3xl p-6 sm:p-8 md:p-12 shadow-md">
                <SavedPrompts
                  prompts={savedPrompts}
                  onLoad={loadPrompt}
                  onDelete={deletePrompt}
                />
              </section>
            </Suspense>
          )}
        </div>

        {/* Footer */}
        <Footer />
      </main>
    </>
  );
}
