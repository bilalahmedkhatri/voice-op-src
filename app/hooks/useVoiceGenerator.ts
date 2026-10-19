'use client';

import {useCopy} from '@/i18n/copy';

import { ownerFetch as fetch } from '@/app/lib/ownerStorage';

import { currentOwnerScope, setOwnerScope, resolveOwnerScope, ownerDrafts } from '@/app/lib/ownerStorage';

import { useState, useEffect, useRef, useCallback } from 'react';
import { VoiceParams } from '../types';
import type { LiveJob } from '../components/LiveAudioPreview';
import { isDatabaseEnabled } from '../lib/config';
import { saveLocalHistoryItem } from '../lib/localHistoryStorage';
import { formatErrorMessage } from '../lib/errorUtils';
import { playCompletionSound } from '../lib/audioNotification';
import { pendingAudioJobs, pendingJobFromHistory, savePendingAudioJob, removePendingAudioJob, type PendingGeneration } from '../lib/pendingAudioJobs';

function dataUriToBlob(dataUri: string): Blob {
  const [header, base64] = dataUri.split(',');
  const mimeMatch = header?.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'audio/wav';
  const binary = atob(base64 || '');
  const len = binary.length;
  const buffer = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    buffer[i] = binary.charCodeAt(i);
  }
  return new Blob([buffer], { type: mime });
}

export interface UserQuotaState {
  generations_used: number;
  max_daily_generations: number;
  max_chars_per_request: number;
  chars_used_today: number;
  max_daily_chars: number;
  reset_at: string;
}

export function useVoiceGenerator() {
  const copy = useCopy();


  const [params, setParams] = useState<VoiceParams>({
    text: '',
    voice: '',
    rate: 1,
    pitch: 1,
    volume: 1,
  });
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [chunkProgress, setChunkProgress] = useState<{ completed: number; total: number } | null>(null);
  const [liveJob, setLiveJob] = useState<LiveJob | null>(null);
  const liveAttemptRef = useRef(0);
  const [pendingJob, setPendingJob] = useState<PendingGeneration | null>(null);
  const [retryAvailable, setRetryAvailable] = useState(false);
  const [generationTime, setGenerationTime] = useState<number | null>(null);
  const [videoFormat, setVideoFormat] = useState<'short' | 'long'>('short');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastNotification, setToastNotification] = useState<{ message: string; type: 'info' | 'success' | 'warning' | 'error' } | null>(null);
  const [userQuota, setUserQuota] = useState<UserQuotaState | null>(null);
  const [availableCredits, setAvailableCredits] = useState<number | null>(null);
  const [userTier, setUserTier] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const generationControllerRef = useRef<AbortController | null>(null);
  const identityScopeRef = useRef<string | null>(null);
  const restoredJob = useRef<string | null>(null);

  // Load session & quota from DB
  const refreshQuota = useCallback(async () => {
    try {
      // Clear any legacy localStorage usage keys that might linger
      if (typeof window !== 'undefined') {
        localStorage.removeItem('vg_usage_status');
        localStorage.removeItem('voice_generator_usage');
      }

      const res = await fetch('/api/auth/session');
      const data = await res.json();
      if (!res.ok || typeof data.owner_scope !== 'string') throw new Error(copy("Account check failed."));
      if (identityScopeRef.current && identityScopeRef.current !== data.owner_scope) {
        generationControllerRef.current?.abort();
        setAudioBlob(null);
        window.location.reload();
        return;
      }
      const initialIdentity = !identityScopeRef.current;
      identityScopeRef.current = data.owner_scope;
      setOwnerScope(data.owner_scope);
      if (initialIdentity) {
        const requested = new URLSearchParams(window.location.search).get('resumeJob');
        const records = pendingAudioJobs();
        let stored = requested ? records.find(job => job.jobId === requested) : records[0];
        if (!stored && data.authenticated && isDatabaseEnabled()) {
          try {
            const response = await fetch('/api/history?pending=true', { cache: 'no-store' });
            const history = response.ok ? await response.json() : {};
            if (currentOwnerScope() !== data.owner_scope) return;
            const rows = history.items || [];
            const row = requested ? rows.find((entry: { id: string }) => entry.id === requested) : rows[0];
            stored = row ? pendingJobFromHistory(row, data.owner_scope) || undefined : undefined;
          } catch { /* Session/local recovery can still continue if history is unavailable. */ }
        }
        if (stored) {
          restoredJob.current = stored.jobId;
          setPendingJob(stored);
          setParams(stored.params);
        }
      }
      if (data.authenticated) {
        setIsAuthenticated(true);
        if (data.quota) setUserQuota(data.quota);
        if (data.user?.available_credits !== undefined) {
          setAvailableCredits(data.user.available_credits);
        }
        if (data.user?.tier) {
          setUserTier(data.user.tier);
        }
      } else {
        setIsAuthenticated(false);
        setUserQuota(null);
        setAvailableCredits(null);
        setUserTier(null);
      }
    } catch {
      setUserQuota(null);
    }
  }, [copy]);

  useEffect(() => {
    refreshQuota();
  }, [refreshQuota]);

  // Synchronize credits when updated across tabs or components
  useEffect(() => {
    const handleCreditsUpdated = (event: Event) => {
      const e = event as CustomEvent<{ credits?: number; tier?: string }>;
      if (e.detail?.credits !== undefined) {
        setAvailableCredits(e.detail.credits);
      }
      if (e.detail?.tier) {
        setUserTier(e.detail.tier);
      }
      refreshQuota();
    };

    window.addEventListener('credits-updated', handleCreditsUpdated);
    return () => window.removeEventListener('credits-updated', handleCreditsUpdated);
  }, [refreshQuota]);

  // Cleanup: abort pending requests on unmount
  useEffect(() => {
    return () => {
      generationControllerRef.current?.abort();
    };
  }, []);

  const handleGenerate = useCallback(async (
    apiVoiceId?: string,
    targetModelId?: string,
    targetFormat: 'short' | 'long' = 'short',
    targetProvider?: string,
    resume?: PendingGeneration
  ) => {
    if (generationControllerRef.current || isGenerating) return;
    const generationParams = resume?.params || structuredClone(params);
    if (!generationParams.text.trim()) {
      setErrorMessage(copy("Please enter some text to generate a voiceover."));
      return;
    }

    if (!apiVoiceId) {
      setErrorMessage(copy("Please select a voice from the dropdown before generating."));
      return;
    }

    if (!targetModelId) {
      setErrorMessage(copy("Please select a model before generating."));
      return;
    }

    const isOnlineDb = isDatabaseEnabled();
    if (isOnlineDb && !isAuthenticated) {
      setErrorMessage(copy("Please sign in with Google above to generate voiceovers."));
      return;
    }

    setVideoFormat(targetFormat);
    setErrorMessage(null);
    if (!resume) {
      setPendingJob(null);
      setLiveJob(null);
      setRetryAvailable(false);
      setChunkProgress(null);
    }
    const startTime = performance.now();

    try {
      const controller = new AbortController();
      generationControllerRef.current = controller;

      setIsGenerating(true);

      const operationScope = await resolveOwnerScope();
      if (operationScope !== currentOwnerScope() || (resume && resume.ownerScope !== operationScope)) {
        window.location.reload();
        throw new Error(copy("Account changed before generation."));
      }
      let data;
      if (resume) {
        data = { status: 'processing', job_id: resume.jobId, job_token: resume.jobToken };
        if (retryAvailable) {
          const retryResponse = await fetch('/api/templates/audio-job/retry', {
            method: 'POST', headers: { 'Content-Type': 'application/json',
              ...(resume.jobToken ? { 'X-Voice-Job-Token': resume.jobToken } : {}) },
            body: JSON.stringify({ jobId: resume.jobId }), signal: controller.signal,
          });
          if (!retryResponse.ok && retryResponse.status !== 409) {
            throw new Error(formatErrorMessage(await retryResponse.json()));
          }
          setRetryAvailable(false);
        }
      } else {
        const templateId = ownerDrafts.getItem('pending_voice_template_id');
        const itemId = ownerDrafts.getItem('pending_voice_item_id');
        const cachedTitle = typeof window !== 'undefined' ? ownerDrafts.getItem("pending_voice_title") : null;

        const response = await fetch('/api/voiceover', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            templateId,
            itemId,
            title: cachedTitle || 'Voiceover Script',
            text: generationParams.text,
            voice_id: apiVoiceId,
            model_id: targetModelId,
            provider: targetProvider,
            options: {
              ...(generationParams.options || {}),
              video_format: targetFormat,
            },
            speed: generationParams.rate,
            pitch: generationParams.pitch,
            volume: generationParams.volume,
            tone: 'neutral',
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          let errorMsg = 'Failed to generate voiceover';
          try {
            const errData = await response.json();
            errorMsg = formatErrorMessage(errData);
            if (response.status === 402 || errData.error === 'INSUFFICIENT_CREDITS' || errData.code === 'INSUFFICIENT_CREDITS') {
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('open-topup-modal', { detail: errData }));
              }
            }
          } catch {
            errorMsg = `Server error: ${response.status} ${response.statusText}`;
          }
          throw new Error(errorMsg);
        }

        data = await response.json();

        // Update available credits balance if returned by API
        if (data.remaining_credits !== undefined) {
          setAvailableCredits(data.remaining_credits);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('credits-updated', { detail: { credits: data.remaining_credits } }));
          }
        }

      }

      // Handle async processing response (backend acknowledges request)
      if (data.status === 'processing' || data.message === 'processing' || data.job_id || data.task_id) {

        const jobId = data.job_id || data.task_id;
        const jobToken = data.job_token;
        setLiveJob({ jobId, jobToken, ownerScope: operationScope, attempt: ++liveAttemptRef.current });
        const persisted = { jobId, jobToken, ownerScope: operationScope, params: generationParams,
          voice: apiVoiceId, model: targetModelId, provider: targetProvider, format: targetFormat };
        setPendingJob(persisted);
        savePendingAudioJob(persisted);

        // Reuse owned polling for both initial generation and selective retry.
        let pollCount = 0;
        let isCompleted = false;
        let pollError: string | null = null;

        while (pollCount < 50 && !isCompleted && !pollError) {
          if (pollCount > 0) await new Promise(resolve => setTimeout(resolve, 5000));

          if (controller.signal.aborted) {
            return;
          }

          try {
            const statusRes = await fetch(`/api/templates/audio-job/status?jobId=${encodeURIComponent(jobId)}`, { signal: controller.signal, cache: 'no-store', headers: jobToken ? { 'X-Voice-Job-Token': jobToken } : {} });
            if ([401, 403, 404].includes(statusRes.status)) {
              setPendingJob(null);
              removePendingAudioJob(jobId);
              throw new Error(copy("This audio job is no longer accessible for your account."));
            }
            if (statusRes.ok) {
              const statusData = await statusRes.json();
              if (statusData.chunks) setChunkProgress(statusData.chunks);
              setRetryAvailable(statusData.retry_available === true);
              if (statusData.status === 'completed' || statusData.status === 'success') {
                isCompleted = true;
                data = statusData;
                break;
              } else if (statusData.status === 'failed') {
                pollError = statusData.error || 'Voice generation failed on the server.';
              }
              // else: still 'processing', loop continues
            }
          } catch (e) {
            if (controller.signal.aborted) return;
            pollError = formatErrorMessage(e);
          }
          pollCount++;
        }

        // Propagate a server-side failure to the UI
        if (pollError) {
          throw new Error(pollError);
        }

        if (!isCompleted) {
          // Polling window ended; background generation may still be running
          setToastNotification({
            type: 'info',
            message: 'Audio is still processing. Use Check progress to continue.'
          });
          setIsGenerating(false);
          generationControllerRef.current = null;
          return;
        }
      }

      let downloadedBlob: Blob;
      if (typeof data.audio_url === 'string' && data.audio_url.startsWith('data:')) {
        downloadedBlob = dataUriToBlob(data.audio_url);
      } else if (data.audio_url) {
        const audioResponse = await fetch(data.audio_url, { signal: controller.signal });
        if (!audioResponse.ok) {
          throw new Error(copy("Failed to download audio file: {v0} {v1}", {v0: audioResponse.status, v1: audioResponse.statusText}));
        }
        downloadedBlob = await audioResponse.blob();
      } else {
        throw new Error(copy("No audio data received from the server."));
      }

      if (controller.signal.aborted || await resolveOwnerScope() !== operationScope) throw new Error(copy("Account changed during generation."));
      setAudioBlob(downloadedBlob);
      setChunkProgress(null);
      setLiveJob(null);
      setToastNotification(null);
      if (data.job_id || resume?.jobId) removePendingAudioJob(data.job_id || resume?.jobId);
      setPendingJob(null);
      setRetryAvailable(false);

      const elapsed = Math.round((performance.now() - startTime) / 100) / 10;
      setGenerationTime(typeof data.generation_time_sec === 'number' ? data.generation_time_sec : elapsed);

      // Play completion chime notification for background/active tab feedback
      playCompletionSound();

      // Save to local IndexedDB storage (instant offline history fallback)
      try {
        await saveLocalHistoryItem({
          id: data.job_id || resume?.jobId,
          prompt_text: generationParams.text,
          model_id: targetModelId,
          model_name: targetModelId,
          voice_id: apiVoiceId,
          voice_name: data.voice_name || apiVoiceId,
          audioBlob: downloadedBlob,
          duration_sec: data.duration_seconds || null,
          generation_time_sec: elapsed,
          video_format: targetFormat,
          parameters: {
            speed: generationParams.rate ?? (generationParams.options?.speed ?? 1.0),
            video_format: targetFormat,
            ...(generationParams.options || {}),
          },
        }, operationScope);
      } catch (localDbErr) {
        console.error('Failed to save to local IndexedDB history:', localDbErr);
      }
      window.dispatchEvent(new Event('audio-library-updated'));

      // Refresh DB quota after successful generation
      await refreshQuota();

      setErrorMessage(null);
      generationControllerRef.current = null;
      setIsGenerating(false);
    } catch (error) {
      setToastNotification(null);
      setIsGenerating(false);

      if (error instanceof Error && error.name === 'AbortError') {
        generationControllerRef.current = null;
        return;
      }

      const rawMessage = formatErrorMessage(error);

      const errorMap: Record<string, string> = {
        '404': 'The selected voice model is not available. Please try a different voice or contact support.',
        'Failed to download audio': 'The audio file could not be downloaded. Please verify the backend configuration.',
        'Failed to fetch': 'Unable to connect to the voiceover API. Make sure the backend server is running at http://localhost:8000.',
      };

      const matchedKey = Object.keys(errorMap).find(key => rawMessage.includes(key));
      const uiMessage = matchedKey ? errorMap[matchedKey] : rawMessage;

      setErrorMessage(uiMessage);
      generationControllerRef.current = null;
    }
  }, [copy, params, isGenerating, isAuthenticated, retryAvailable, refreshQuota]);

  useEffect(() => {
    if (!pendingJob || restoredJob.current !== pendingJob.jobId || (isDatabaseEnabled() && !isAuthenticated)) return;
    restoredJob.current = null;
    // Resume polling once; a failed/quota-limited job still needs explicit retry.
    void handleGenerate(pendingJob.voice, pendingJob.model, pendingJob.format, pendingJob.provider, pendingJob);
  }, [pendingJob, isAuthenticated, handleGenerate]);

  const loadPrompt = (prompt: string) => {
    setParams(prev => ({ ...prev, text: prompt }));
  };

  const dismissError = () => setErrorMessage(null);
  const clearToast = () => setToastNotification(null);

  // Compute remaining attempts from real DB quota if logged in
  const remainingGenerations = userQuota
    ? Math.max(0, userQuota.max_daily_generations - userQuota.generations_used)
    : null;

  return {
    params,
    setParams,
    audioBlob,
    handleGenerate,
    isGenerating,
    chunkProgress,
    liveJob,
    pendingJob: Boolean(pendingJob),
    retryAvailable,
    handleResume: () => pendingJob && handleGenerate(pendingJob.voice, pendingJob.model,
      pendingJob.format, pendingJob.provider, pendingJob),
    generationTime,
    errorMessage,
    dismissError,
    toastNotification,
    clearToast,
    loadPrompt,
    videoFormat,
    setVideoFormat,
    userQuota,
    availableCredits,
    userTier,
    isAuthenticated,
    isOnlineDb: isDatabaseEnabled(),
    remainingGenerations,
    refreshQuota,
  };
}
