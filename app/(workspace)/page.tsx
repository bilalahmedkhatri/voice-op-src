'use client';

import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { FaMicrophone, FaSync, FaGoogle } from 'react-icons/fa';
import { FiMic } from 'react-icons/fi';
import { useVoiceGenerator } from '../hooks/useVoiceGenerator';
import { useVoiceSamples } from '../hooks/useVoiceSamples';
import { useModels } from '../hooks/useModels';
import TextInput from '../components/TextInput';
import VoiceControls from '../components/VoiceControls';
import AudioPlayer from '../components/AudioPlayer';
import GenerationStatus from '../components/GenerationStatus';
import { useIsClient } from '../hooks/useIsClient';
import LoadingSkeleton from '../components/LoadingSkeleton';
import {
  VoicePresetItem,
  getLocalPresets,
  saveLocalPreset,
  deleteLocalPreset,
} from '../lib/localPresetStorage';
import FormatSelectionModal, { VideoFormat } from '../components/FormatSelectionModal';

const SavedPrompts = lazy(() => import('../components/SavedPrompts'));

export default function VoiceGeneratorPage() {
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
    setVideoFormat,
    isGenerating,
    generationTime,
    errorMessage,
    dismissError,
    isAuthenticated,
    isOnlineDb,
    remainingGenerations,
  } = useVoiceGenerator();

  const [sourceInfo, setSourceInfo] = useState<{ title?: string; type?: string } | null>(null);

  // Check for script prefilled from Content Strategy
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const pendingScript = localStorage.getItem('pending_voice_script');
      const pendingFormat = localStorage.getItem('pending_voice_format');
      const pendingTitle = localStorage.getItem('pending_voice_title');

      if (pendingScript) {
        setParams((prev) => ({ ...prev, text: pendingScript }));
        if (pendingFormat === 'long' || pendingFormat === 'short') {
          setVideoFormat(pendingFormat);
        }
        if (pendingTitle) {
          setSourceInfo({ title: pendingTitle, type: pendingFormat || undefined });
        }
        localStorage.removeItem('pending_voice_script');
        localStorage.removeItem('pending_voice_format');
        localStorage.removeItem('pending_voice_title');
      }
    }
  }, [setParams, setVideoFormat]);

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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <FiMic className="w-6 h-6 text-blue-600" />
            <span>AI Voice Generator</span>
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Transform text into natural-sounding speech with Kokoro and multi-model voice synthesis.
          </p>
        </div>

        {/* Plan / Quota Status Badge */}
        {isClient ? (
          <div>
            {isAuthenticated && remainingGenerations !== null ? (
              <div
                className={`text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1.5 border ${
                  isLimitReached
                    ? 'bg-red-50 border-red-200 text-red-600'
                    : 'bg-white border-slate-200 text-slate-700 shadow-xs'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isLimitReached ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'
                  }`}
                />
                <span>
                  <strong>Free Studio Plan</strong> • {remainingGenerations} generation
                  {remainingGenerations !== 1 ? 's' : ''} left today
                </span>
              </div>
            ) : (
              <div className="text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1.5 bg-white border border-slate-200 text-emerald-700 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Free Studio Plan</span>
              </div>
            )}
          </div>
        ) : (
          <div className="h-7 w-32 bg-slate-100 animate-pulse rounded-xl" />
        )}
      </div>

      {/* Script Source Notification */}
      {sourceInfo && (
        <div className="flex items-center justify-between p-3.5 bg-blue-50/90 border border-blue-200 rounded-xl text-xs text-blue-900 shadow-2xs animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 bg-blue-600 text-white rounded-lg shadow-2xs">
              <FiMic className="w-3.5 h-3.5" />
            </span>
            <span>
              Script loaded from content strategy: <strong className="text-blue-950 font-semibold">{sourceInfo.title || 'Untitled'}</strong>
              {sourceInfo.type && (
                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full font-semibold text-[10px] uppercase border border-blue-200">
                  {sourceInfo.type === 'long' ? 'Long Video' : 'Short Video'}
                </span>
              )}
            </span>
          </div>
          <button
            onClick={() => setSourceInfo(null)}
            className="text-blue-600 hover:text-blue-800 text-xs font-semibold cursor-pointer underline ml-3"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Studio Card */}
      <section
        aria-label="Voiceover generation controls"
        className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm"
      >
        {/* ElevenLabs-style Split Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch mb-6">
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
          <div className="lg:col-span-5 flex flex-col bg-slate-50/70 rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs">
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
        <div className="flex flex-col gap-4 pt-4 border-t border-slate-100">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/90 p-3 sm:p-3.5 rounded-xl border border-slate-200">
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

            {/* Compact Generate Button / Sign In */}
            {isAuthRequired ? (
              <a
                href="/api/auth/google"
                className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold cursor-pointer transition-all duration-200 shadow-sm hover:shadow flex items-center justify-center gap-2"
              >
                <FaGoogle className="text-xs" />
                <span>Sign in to Generate</span>
              </a>
            ) : (
              <button
                onClick={handleGenerateClick}
                disabled={!params.text.trim() || isGenerating || isLimitReached}
                className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold cursor-pointer transition-all duration-200 shadow-sm hover:shadow disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
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
        <Suspense
          fallback={
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <LoadingSkeleton variant="savedPrompts" />
            </div>
          }
        >
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <SavedPrompts
              prompts={savedPrompts}
              onLoad={loadPrompt}
              onDelete={deletePrompt}
            />
          </div>
        </Suspense>
      )}
    </div>
  );
}
