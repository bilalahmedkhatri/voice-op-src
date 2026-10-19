'use client';

import {browserSignInUrl} from '@/i18n/browserNavigation';
import {errorCopy} from '@/i18n/errors';

import {SignInButton} from '@/app/components/SignInLink';

import {useCopy} from '@/i18n/copy';

import WorkspacePageHeader from "@/app/components/workspace/WorkspacePageHeader";

import { ownerFetch as fetch } from '@/app/lib/ownerStorage';

import { ownerDrafts } from '@/app/lib/ownerStorage';

import { useState, useEffect, useCallback } from 'react';
import { FaMicrophone, FaSync, FaGoogle } from 'react-icons/fa';
import { FiMic } from 'react-icons/fi';
import { useVoiceGenerator } from '../../../hooks/useVoiceGenerator';
import { useVoiceSamples } from '../../../hooks/useVoiceSamples';
import { useModels } from '../../../hooks/useModels';
import TextInput from '../../../components/TextInput';
import VoiceControls from '../../../components/VoiceControls';
import AudioPlayer from '../../../components/AudioPlayer';
import LiveAudioPreview from '@/app/components/LiveAudioPreview';
import GenerationStatus from '../../../components/GenerationStatus';
import Toast from '../../../components/Toast';
import {
  VoicePresetItem,
  getLocalPresets,
  saveLocalPreset,
  deleteLocalPreset,
} from '../../../lib/localPresetStorage';
import FormatSelectionModal, { VideoFormat } from '../../../components/FormatSelectionModal';
import { Button } from '@/components/ui';
import { calculateVoiceCost } from '../../../lib/pricing';

export default function AdminVoiceStudioPage() {
  const copy = useCopy();


  const {
    params,
    setParams,
    audioBlob,
    handleGenerate,
    loadPrompt,
    videoFormat,
    setVideoFormat,
    isGenerating,
    generationTime,
    errorMessage,
    dismissError,
    chunkProgress, liveJob, pendingJob, retryAvailable, handleResume,
    toastNotification,
    clearToast,
    isAuthenticated,
    isOnlineDb,
    remainingGenerations,
    availableCredits,
  } = useVoiceGenerator();

  const [sourceInfo, setSourceInfo] = useState<{ title?: string; type?: string } | null>(null);

  // Check for script prefilled from Content Strategy
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const pendingScript = ownerDrafts.getItem('pending_voice_script');
      const pendingFormat = ownerDrafts.getItem('pending_voice_format');
      const pendingTitle = ownerDrafts.getItem('pending_voice_title');

      if (pendingScript) {
        setParams((prev) => ({ ...prev, text: pendingScript }));
        if (pendingFormat === 'long' || pendingFormat === 'short') {
          setVideoFormat(pendingFormat);
        }
        if (pendingTitle) {
          setSourceInfo({ title: pendingTitle, type: pendingFormat || undefined });
        } else {
          setSourceInfo({ title: copy("Imported Campaign Script"), type: pendingFormat || 'Short Video' });
        }
        ownerDrafts.removeItem('pending_voice_script');
        ownerDrafts.removeItem('pending_voice_format');
        ownerDrafts.removeItem('pending_voice_title');
      }
    }
  }, [copy, setParams, setVideoFormat]);

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
  const [isFormatModalOpen, setIsFormatModalOpen] = useState(false);

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

  const selectedModelObj = apiModels.find((m) => m.name === selectedModelId);
  const selectedProvider = selectedModelObj?.provider;

  const handleGenerateClick = () => {
    if (isOnlineDb && !isAuthenticated) {
      window.location.href = browserSignInUrl();
      return;
    }
    if (isOnlineDb && isAuthenticated && availableCredits !== null && availableCredits < 2) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('open-topup-modal'));
      }
      return;
    }
    if (!params.text.trim()) {
      handleGenerate(selectedApiVoice || undefined, selectedModelId, 'short', selectedProvider);
      return;
    }
    // Open sleek format selection popup
    setIsFormatModalOpen(true);
  };

  const handleConfirmFormat = async (format: VideoFormat) => {
    setIsFormatModalOpen(false);
    await handleGenerate(selectedApiVoice || undefined, selectedModelId, format, selectedProvider);
  };

  const isAuthRequired = isOnlineDb && !isAuthenticated;
  const isLimitReached = isOnlineDb && isAuthenticated && availableCredits !== null && availableCredits < 2;

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

  const currentEstimatedCost = calculateVoiceCost(params.text.length, selectedModelId, selectedProvider);

  return (
    <div className="space-y-6 mx-auto">

      {/* Script Source Notification */}
      {sourceInfo && (
        <div className="flex items-center justify-between p-3.5 bg-orange-50/90 border border-orange-200/80 rounded-xl text-xs text-orange-950 shadow-2xs animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 bg-[#ff7d6e] text-white rounded-lg shadow-2xs">
              <FiMic className="w-3.5 h-3.5" />
            </span>
            <span>
              {copy("Script loaded from content strategy: ")}<strong className="text-orange-950 font-semibold">{sourceInfo.title || copy("Untitled")}</strong>
              {sourceInfo.type && (
                <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-800 rounded-full font-semibold text-[10px] uppercase border border-orange-200">
                  {sourceInfo.type === 'long' ? copy("Long Video") : copy("Short Video")}
                </span>
              )}
            </span>
          </div>
          <button
            onClick={() => setSourceInfo(null)}
            className="text-orange-700 hover:text-orange-900 text-xs font-semibold cursor-pointer underline ml-3"
          >
            {copy("Dismiss")}</button>
        </div>
      )}

      {/* Main Studio Card */}
      <section
        aria-label={copy("Voiceover generation controls")}
        className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-6 shadow-xs"
      >
        {/* ElevenLabs-style Split Workspace Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 sm:gap-6 items-stretch mb-6">
          {/* Left Column: Text Input */}
          <div className="xl:col-span-7 flex flex-col">
            <TextInput
              text={params.text}
              onTextChange={(text) => setParams({ ...params, text })}
              disabled={isLimitReached}
              selectedModelId={selectedModelId}
              selectedProvider={selectedProvider}
            />
          </div>

          {/* Right Column: Scrollable Playable Voices & Parameters */}
          <div className="xl:col-span-5 flex flex-col bg-slate-50/70 rounded-2xl p-3.5 sm:p-5">
            <section aria-label={copy("Voice parameters")}>
              <h3 className="sr-only">{copy("Adjust Voice Parameters")}</h3>
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
                presets={presets}
                onApplyPreset={handleApplyPreset}
                onDeletePreset={handleDeletePreset}
              />
            </section>
          </div>
        </div>

        {/* Bottom Actions & Player Area */}
        <div className="flex flex-col gap-4 pt-4">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 sm:p-3.5">
            <div className="text-xs text-slate-500 font-medium">
              {selectedVoiceObj ? (
                <span>
                  {copy("Selected Voice: ")}<strong className="text-slate-800">{selectedVoiceObj.voice_name}</strong> (
                  {selectedModelId || copy("Default Model")})
                </span>
              ) : (
                <span>{copy("Select a voice model to generate")}</span>
              )}
            </div>

            {/* Compact Generate Button / Sign In */}
            {isAuthRequired ? (
              <SignInButton

                variant="primary"
                size="lg"
                className="w-full sm:w-auto shadow-xs hover:shadow"
                icon={<FaGoogle className="w-3.5 h-3.5" />}
              >
                {copy("Sign in to Generate")}</SignInButton>
            ) : (
              <Button
                onClick={handleGenerateClick}
                disabled={!params.text.trim() || isGenerating || isLimitReached}
                isLoading={isGenerating}
                variant="primary"
                size="lg"
                className="w-full sm:w-auto shadow-xs hover:shadow"
                icon={<FaMicrophone className="w-3.5 h-3.5" />}
              >
                {isGenerating
                  ? copy("Generating...")
                  : copy("Generate Voiceover {v0}", {v0: currentEstimatedCost > 0 ? `(${copy('{v0, plural, one {# Credit} other {# Credits}}', {v0: currentEstimatedCost})})` : ''})
                }
              </Button>
            )}
          </div>

          <GenerationStatus
            errorMessage={errorCopy(errorMessage, copy)}
            onDismissError={dismissError}
            progress={chunkProgress} isGenerating={isGenerating && !audioBlob}
            onResume={pendingJob ? handleResume : undefined} retryAvailable={retryAvailable}
          >
            {liveJob && <LiveAudioPreview key={liveJob.jobId} job={liveJob} />}
          </GenerationStatus>

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

    </div>
  );
}
