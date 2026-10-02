'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaMicrophone, FaGoogle, FaMagic } from 'react-icons/fa';
import { FiArrowRight } from 'react-icons/fi';
import { useVoiceGenerator } from '@/app/hooks/useVoiceGenerator';
import { useVoiceSamples } from '@/app/hooks/useVoiceSamples';
import { useModels } from '@/app/hooks/useModels';
import TextInput from '@/app/components/TextInput';
import VoiceControls from '@/app/components/VoiceControls';
import AudioPlayer from '@/app/components/AudioPlayer';
import GenerationStatus from '@/app/components/GenerationStatus';
import Toast from '@/app/components/Toast';
import FormatSelectionModal, { VideoFormat } from '@/app/components/FormatSelectionModal';
import { Button } from '@/components/ui';

const LANDING_SAMPLE_TEXT =
  'Never spend 5 hours recording and editing voiceovers again. Turn any script into natural speech and schedule your entire weekly content feed with 1-click publishing.';

const MAX_LANDING_CHARS = 450;

export default function LandingInteractiveStudio() {
  const {
    params,
    setParams,
    audioBlob,
    handleGenerate,
    videoFormat,
    isGenerating,
    generationTime,
    errorMessage,
    dismissError,
    toastNotification,
    clearToast,
    isAuthenticated,
    isOnlineDb,
    remainingGenerations,
  } = useVoiceGenerator();

  const { models: apiModels, loading: apiModelsLoading } = useModels();
  const [selectedModelId, setSelectedModelId] = useState('');

  // Auto-select first model once models are loaded if none currently selected
  useEffect(() => {
    if (!selectedModelId && apiModels.length > 0) {
      setSelectedModelId(apiModels[0].name);
    }
  }, [apiModels, selectedModelId]);

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

  const [isFormatModalOpen, setIsFormatModalOpen] = useState(false);

  // Initialize with sample text on landing page
  useEffect(() => {
    if (!params.text) {
      setParams((prev) => ({ ...prev, text: LANDING_SAMPLE_TEXT }));
    }
  }, [setParams, params.text]);

  const selectedModelObj = apiModels.find((m) => m.name === selectedModelId);
  const selectedProvider = selectedModelObj?.provider;

  const isTextTooLong = params.text.length > MAX_LANDING_CHARS;

  const handleGenerateClick = () => {
    if (isOnlineDb && !isAuthenticated) {
      window.location.href = '/api/auth/google';
      return;
    }
    if (!params.text.trim()) {
      handleGenerate(selectedApiVoice || undefined, selectedModelId, 'short', selectedProvider);
      return;
    }
    if (isTextTooLong) {
      return;
    }
    setIsFormatModalOpen(true);
  };

  const handleConfirmFormat = async (format: VideoFormat) => {
    setIsFormatModalOpen(false);
    await handleGenerate(selectedApiVoice || undefined, selectedModelId, format, selectedProvider);
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
    <section id="live-studio" className="py-12 sm:py-16 lg:py-20 bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200/80 text-[#c83a2a] text-xs font-semibold">
            <FaMagic className="text-xs" />
            <span>Interactive Multi-Model Voice Studio</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900">
            Generate Studio Voiceovers Live
          </h2>
          <p className="text-base sm:text-lg text-slate-600">
            Test scripts, audition voices, and preview lifelike multi-model voice synthesis directly in your browser.
          </p>
        </div>

        {/* Main Studio Card Container */}
        <div className="bg-white border border-slate-200/90 rounded-3xl shadow-sm p-4 sm:p-6 lg:p-8">
          {/* Split Workspace Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 sm:gap-6 items-stretch mb-6">
            {/* Left Column: Text Input with Landing Character Limit Warning */}
            <div className="xl:col-span-7 flex flex-col">
              <TextInput
                text={params.text}
                onTextChange={(text) => setParams({ ...params, text })}
                disabled={isLimitReached}
              />
              {/* Landing Page Demo Notice */}
              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 px-1">
                <span>
                  {isTextTooLong ? (
                    <span className="text-rose-600 font-semibold">
                      Demo text exceeds {MAX_LANDING_CHARS} characters. Shorten text or sign in for unlimited scripts.
                    </span>
                  ) : (
                    <span>Landing Preview: {params.text.length}/{MAX_LANDING_CHARS} characters</span>
                  )}
                </span>
                <Link
                  href="/admin"
                  className="text-[#c83a2a] hover:underline font-medium inline-flex items-center gap-1"
                >
                  Full Studio Access <FiArrowRight className="text-[10px]" />
                </Link>
              </div>
            </div>

            {/* Right Column: Voice Controls (Model Selector, Voice Dropdown, Parameters) */}
            <div className="xl:col-span-5 flex flex-col bg-slate-50/80 rounded-2xl p-3.5 sm:p-5 border border-slate-200/60">
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
              />
            </div>
          </div>

          {/* Bottom Actions & Player Toolbar */}
          <div className="flex flex-col gap-4 pt-4 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-500 font-medium">
                {selectedVoiceObj ? (
                  <span>
                    Selected Voice: <strong className="text-slate-800">{selectedVoiceObj.voice_name}</strong> (
                    {selectedModelId || 'Default Model'})
                  </span>
                ) : (
                  <span>Select a voice model to generate</span>
                )}
              </div>

              {/* Action Button */}
              {isAuthRequired ? (
                <Button
                  href="/api/auth/google"
                  variant="primary"
                  size="lg"
                  className="w-full sm:w-auto shadow-xs"
                  icon={<FaGoogle className="w-3.5 h-3.5" />}
                >
                  Sign in to Generate
                </Button>
              ) : (
                <Button
                  onClick={handleGenerateClick}
                  disabled={!params.text.trim() || isGenerating || isLimitReached || isTextTooLong}
                  isLoading={isGenerating}
                  variant="primary"
                  size="lg"
                  className="w-full sm:w-auto shadow-xs"
                  icon={<FaMicrophone className="w-3.5 h-3.5" />}
                >
                  {isGenerating ? 'Generating...' : 'Generate Voiceover'}
                </Button>
              )}
            </div>

            <GenerationStatus
              errorMessage={errorMessage}
              onDismissError={dismissError}
            />

            {toastNotification && (
              <div className="fixed bottom-4 right-4 z-50">
                <Toast
                  message={toastNotification.message}
                  type={toastNotification.type}
                  onClose={clearToast}
                />
              </div>
            )}

            <AudioPlayer
              audioUrl={null}
              audioBlob={audioBlob}
              isGenerating={isGenerating}
              generationTime={generationTime}
              videoFormat={videoFormat}
              activeVoiceMeta={activeVoiceMeta}
              activeParameters={params.options || { speed: params.rate }}
            />
          </div>
        </div>

        {/* Format Selection Modal */}
        <FormatSelectionModal
          isOpen={isFormatModalOpen}
          onClose={() => setIsFormatModalOpen(false)}
          onSelectFormat={handleConfirmFormat}
          text={params.text}
          isGenerating={isGenerating}
        />
      </div>
    </section>
  );
}
