'use client';

import { FaMicrophone, FaSync } from 'react-icons/fa';
import { useVoiceGenerator } from './hooks/useVoiceGenerator';
import { useVoiceSamples } from './hooks/useVoiceSamples';
import TextInput from './components/TextInput';
import VoiceControls from './components/VoiceControls';
import AudioPlayer from './components/AudioPlayer';
import GenerationStatus from './components/GenerationStatus';
import ApiToggle from './components/ApiToggle';
import Footer from './Footer';
import { designSystem as ds } from './lib/designSystem';
import { useState, useEffect, lazy, Suspense } from 'react';
import { useIsClient } from './hooks/useIsClient';
import LoadingSkeleton from './components/LoadingSkeleton';


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
    isGenerating,
    generationTime,
    errorMessage,
    dismissError,
    remainingAttempts,
    resetTime,
  } = useVoiceGenerator();



  const [selectedModelId, setSelectedModelId] = useState('kokoro-local');
  const { voices: apiVoices, loading: apiVoicesLoading, error: apiVoicesError, refetch: refetchVoices } = useVoiceSamples(selectedModelId);
  const [selectedApiVoice, setSelectedApiVoice] = useState('');
  const [apiModeKey, setApiModeKey] = useState(0);
  const isClient = useIsClient();

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

  const handleApiToggle = (useReplicate: boolean) => {
    const targetModel = useReplicate ? 'kokoro-replicate' : 'kokoro-local';
    setSelectedModelId(targetModel);
    setSelectedApiVoice('');
  };

  const features = [
    { text: 'Instant Generation' },
    { text: 'Voice Customization' },
    { text: 'Save Prompts' },
  ];

  const handleGenerateClick = async () => {
    await handleGenerate(selectedApiVoice || undefined);
  };


  return (
    <>
      <main className="min-h-screen bg-gradient-to-br from-red-50 via-red-100 via-red-200 to-red-300 relative">

        {/* API Toggle - Fixed Top Right (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed top-4 sm:top-6 md:top-8 right-4 sm:right-6 md:right-8 z-50">
            <ApiToggle onToggle={handleApiToggle} />
          </div>
        )}

        {/* Hero Section */}
        <section className="bg-gradient-to-br from-red-200 to-red-300 text-gray-900 px-4 sm:px-8 md:px-16 py-8 sm:py-12 md:py-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-transparent" />

          <div className="max-w-7xl mx-auto relative z-10 px-4 sm:px-8 md:px-16">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-4 text-gray-900 tracking-tight">
              AI Voiceover Generator
            </h1>
            <p className="text-base sm:text-lg max-w-3xl mx-auto mb-8 text-gray-800 leading-relaxed font-normal px-4">
              Instantly transform text into high-quality, natural-sounding speech with our free AI Voice Generator.
              Perfect for content creators, educators, and developers, our advanced text-to-speech (TTS) tool offers a seamless experience with customizable voice parameters.
              Start creating professional voiceovers in seconds—no sign-up required.
            </p>

            {/* Feature Pills */}
            <div className="flex gap-4 justify-center flex-wrap mt-8">
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
                  disabled={remainingAttempts === 0}
                />
              </div>

              {/* Right Column: Scrollable Playable Voices & Parameters */}
              <div className="lg:col-span-5 flex flex-col bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-xs">
                <section aria-label="Voice parameters">
                  <h3 className="sr-only">Adjust Voice Parameters</h3>
                  <VoiceControls
                    key={apiModeKey}
                    params={params}
                    onParamsChange={setParams}
                    apiVoices={apiVoices}
                    apiVoicesLoading={apiVoicesLoading}
                    apiVoicesError={apiVoicesError}
                    onApiVoiceChange={setSelectedApiVoice}
                    selectedApiVoice={selectedApiVoice}
                    selectedModelId={selectedModelId}
                    onModelChange={handleModelChange}
                  />
                </section>
              </div>
            </div>

            {/* Bottom Actions & Player Area */}
            <div className="flex flex-col gap-4 pt-4 border-t border-gray-100">
              {/* Toolbar: Usage Badge & Compact Generate Button */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/80 p-3 sm:p-3.5 rounded-2xl border border-gray-100">
                {/* Usage Limit Badge */}
                {isClient && remainingAttempts !== null ? (
                  <div className={`text-xs font-medium px-3 py-1.5 rounded-xl flex items-center gap-1.5 ${remainingAttempts === 0
                      ? 'bg-red-50 border border-red-200 text-red-600'
                      : 'bg-white border border-gray-200/80 text-gray-700 shadow-2xs'
                    }`}>
                    {remainingAttempts > 0 ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span><strong>{remainingAttempts}</strong> generation{remainingAttempts !== 1 ? 's' : ''} left</span>
                        {resetTime && <span className="text-gray-400 font-normal">({resetTime})</span>}
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        <span>Limit reached ({resetTime || 'waiting'})</span>
                      </>
                    )}
                  </div>
                ) : <div />}

                {/* Compact Generate Button */}
                <button
                  onClick={handleGenerateClick}
                  disabled={!params.text.trim() || isGenerating || remainingAttempts === 0}
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
                fileName="voiceover.wav"
              />
            </div>
          </section>

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
