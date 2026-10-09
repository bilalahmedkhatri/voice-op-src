'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { VoiceParams } from '../types';
import { isDatabaseEnabled } from '../lib/config';
import { saveLocalHistoryItem } from '../lib/localHistoryStorage';
import { formatErrorMessage } from '../lib/errorUtils';
import { playCompletionSound } from '../lib/audioNotification';

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
  const [params, setParams] = useState<VoiceParams>({
    text: '',
    voice: '',
    rate: 1,
    pitch: 1,
    volume: 1,
  });
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationTime, setGenerationTime] = useState<number | null>(null);
  const [videoFormat, setVideoFormat] = useState<'short' | 'long'>('short');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastNotification, setToastNotification] = useState<{ message: string; type: 'info' | 'success' | 'warning' | 'error' } | null>(null);
  const [userQuota, setUserQuota] = useState<UserQuotaState | null>(null);
  const [availableCredits, setAvailableCredits] = useState<number | null>(null);
  const [userTier, setUserTier] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const generationControllerRef = useRef<AbortController | null>(null);

  // Load session & quota from DB
  const refreshQuota = useCallback(async () => {
    try {
      // Clear any legacy localStorage usage keys that might linger
      if (typeof window !== 'undefined') {
        localStorage.removeItem('vg_usage_status');
        localStorage.removeItem('voice_generator_usage');
      }

      if (!isDatabaseEnabled()) return;

      const res = await fetch('/api/auth/session');
      const data = await res.json();
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
  }, []);

  useEffect(() => {
    refreshQuota();
  }, [refreshQuota]);

  // Synchronize credits when updated across tabs or components
  useEffect(() => {
    const handleCreditsUpdated = (e: any) => {
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
    const controller = generationControllerRef.current;
    return () => {
      controller?.abort();
    };
  }, []);

  const handleGenerate = async (
    apiVoiceId?: string,
    targetModelId?: string,
    targetFormat: 'short' | 'long' = 'short',
    targetProvider?: string
  ) => {
    if (!params.text.trim()) {
      setErrorMessage('Please enter some text to generate a voiceover.');
      return;
    }

    if (!apiVoiceId) {
      setErrorMessage('Please select a voice from the dropdown before generating.');
      return;
    }

    if (!targetModelId) {
      setErrorMessage('Please select a model before generating.');
      return;
    }

    const isOnlineDb = isDatabaseEnabled();
    if (isOnlineDb && !isAuthenticated) {
      setErrorMessage('Please sign in with Google above to generate voiceovers.');
      return;
    }

    setVideoFormat(targetFormat);
    setErrorMessage(null);
    const startTime = performance.now();

    try {
      generationControllerRef.current?.abort();
      const controller = new AbortController();
      generationControllerRef.current = controller;

      setIsGenerating(true);

      const cachedTitle = typeof window !== 'undefined' ? localStorage.getItem("pending_voice_title") : null;

      const response = await fetch('/api/voiceover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: cachedTitle || 'Voiceover Script',
          text: params.text,
          voice_id: apiVoiceId,
          model_id: targetModelId,
          provider: targetProvider,
          options: {
            ...(params.options || {}),
            video_format: targetFormat,
          },
          speed: params.rate,
          pitch: params.pitch,
          volume: params.volume,
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

      let data = await response.json();

      // Update available credits balance if returned by API
      if (data.remaining_credits !== undefined) {
        setAvailableCredits(data.remaining_credits);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('credits-updated', { detail: { credits: data.remaining_credits } }));
        }
      }

      // Handle async processing response (backend acknowledges request)
      if (data.status === 'processing' || data.message === 'processing' || data.job_id || data.task_id) {

        const jobId = data.job_id || data.task_id;

        // Save the job_id if we came from Content Detail page
        if (typeof window !== 'undefined' && jobId) {
          const tId = localStorage.getItem('pending_voice_template_id');
          const iId = localStorage.getItem('pending_voice_item_id');

          if (tId && iId) {
            fetch('/api/templates/audio-job', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                templateId: tId,
                itemId: iId,
                jobId: jobId,
                voiceName: data.voice_name || apiVoiceId,
                voiceId: apiVoiceId,
                modelId: targetModelId
              })
            }).catch(e => console.error('Failed to save audio job_id:', e));
          }
        }

        setToastNotification({
          type: 'info',
          message: 'Your request is processing. Please wait...'
        });

        // Polling logic: 5 requests, 10 seconds apart
        let pollCount = 0;
        let isCompleted = false;
        let pollError: string | null = null;

        while (pollCount < 50 && !isCompleted && !pollError) {
          await new Promise(resolve => setTimeout(resolve, 5000)); // 5 seconds

          if (generationControllerRef.current?.signal.aborted) {
            return;
          }

          try {
            const statusRes = await fetch(`/api/templates/audio-job/status?jobId=${jobId}`);
            if (statusRes.ok) {
              const statusData = await statusRes.json();
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
            console.warn('Polling check failed (network?), will retry:', e);
          }
          pollCount++;
        }

        // Propagate a server-side failure to the UI
        if (pollError) {
          throw new Error(pollError);
        }

        if (!isCompleted) {
          // Timed out after 5 attempts — backend still processing
          setToastNotification({
            type: 'info',
            message: 'Audio is still being processed. Check Content Detail page later for the result.'
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
          throw new Error(`Failed to download audio file: ${audioResponse.status} ${audioResponse.statusText}`);
        }
        downloadedBlob = await audioResponse.blob();
      } else {
        throw new Error('No audio data received from the server.');
      }

      setAudioBlob(downloadedBlob);

      const elapsed = Math.round((performance.now() - startTime) / 100) / 10;
      setGenerationTime(elapsed);

      // Play completion chime notification for background/active tab feedback
      playCompletionSound();

      // Save to local IndexedDB storage (instant offline history fallback)
      try {
        await saveLocalHistoryItem({
          prompt_text: params.text,
          model_id: targetModelId,
          model_name: targetModelId,
          voice_id: apiVoiceId,
          voice_name: data.voice_name || apiVoiceId,
          audioBlob: downloadedBlob,
          duration_sec: data.duration_seconds || null,
          generation_time_sec: elapsed,
          video_format: targetFormat,
          parameters: {
            speed: params.rate ?? (params.options?.speed ?? 1.0),
            video_format: targetFormat,
            ...(params.options || {}),
          },
        });
      } catch (localDbErr) {
        console.error('Failed to save to local IndexedDB history:', localDbErr);
      }

      // Refresh DB quota after successful generation
      await refreshQuota();

      // If we finished successfully from polling or direct generation and came from Content Detail page, update the DB with URL
      if (data.audio_url && typeof window !== 'undefined') {
        const tId = localStorage.getItem('pending_voice_template_id');
        const iId = localStorage.getItem('pending_voice_item_id');
        const jobId = data.job_id || data.task_id || `job_${Date.now()}`;

        if (tId && iId) {
          fetch('/api/templates/audio-job', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              templateId: tId,
              itemId: iId,
              jobId: jobId,
              audioUrl: data.audio_url,
              voiceName: data.voice_name || apiVoiceId,
              voiceId: apiVoiceId,
              modelId: targetModelId,
              createdAt: new Date().toISOString(),
            }),
          }).catch((e) => console.error('Failed to save audio_url to db:', e));
        }
      }

      setErrorMessage(null);
      generationControllerRef.current = null;
      setIsGenerating(false);
    } catch (error) {
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
  };

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
