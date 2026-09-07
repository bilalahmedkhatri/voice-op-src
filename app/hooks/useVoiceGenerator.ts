'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { VoiceParams } from '../types';
import { promptStorage } from '../lib/promptStorage';
import { isDatabaseEnabled } from '../lib/config';
import { saveLocalHistoryItem } from '../lib/localHistoryStorage';
import { getModelDefinition, DEFAULT_MODEL_ID } from '../lib/tts/registry';
import { formatErrorMessage } from '../lib/errorUtils';

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
  const [savedPrompts, setSavedPrompts] = useState<string[]>([]);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationTime, setGenerationTime] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [userQuota, setUserQuota] = useState<UserQuotaState | null>(null);
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
      if (data.authenticated && data.quota) {
        setIsAuthenticated(true);
        setUserQuota(data.quota);
      } else {
        setIsAuthenticated(false);
        setUserQuota(null);
      }
    } catch {
      setUserQuota(null);
    }
  }, []);

  useEffect(() => {
    const prompts = promptStorage.load();
    setSavedPrompts(prompts);
    refreshQuota();
  }, [refreshQuota]);

  useEffect(() => {
    if (savedPrompts.length > 0 || promptStorage.count() > 0) {
      promptStorage.save(savedPrompts);
    }
  }, [savedPrompts]);

  // Cleanup: abort pending requests on unmount
  useEffect(() => {
    const controller = generationControllerRef.current;
    return () => {
      controller?.abort();
    };
  }, []);

  const handleGenerate = async (apiVoiceId?: string) => {
    if (!params.text.trim()) {
      setErrorMessage('Please enter some text to generate a voiceover.');
      return;
    }

    if (!apiVoiceId) {
      setErrorMessage('Please select a voice from the dropdown before generating.');
      return;
    }

    setErrorMessage(null);
    const startTime = performance.now();
    const targetModelId = params.modelId || DEFAULT_MODEL_ID;

    try {
      generationControllerRef.current?.abort();
      const controller = new AbortController();
      generationControllerRef.current = controller;

      setIsGenerating(true);

      const response = await fetch('/api/voiceover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: params.text,
          voice_id: apiVoiceId,
          model_id: targetModelId,
          options: params.options || { speed: params.rate },
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
        } catch {
          errorMsg = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();

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

      // Save to local IndexedDB storage (instant offline history fallback)
      try {
        const modelDef = getModelDefinition(targetModelId);
        await saveLocalHistoryItem({
          prompt_text: params.text,
          model_id: targetModelId,
          model_name: modelDef.name || targetModelId,
          voice_id: apiVoiceId,
          voice_name: data.voice_name || apiVoiceId,
          audioBlob: downloadedBlob,
          duration_sec: data.duration_seconds || null,
          generation_time_sec: elapsed,
          parameters: params.options || {},
        });
      } catch (localDbErr) {
        console.error('Failed to save to local IndexedDB history:', localDbErr);
      }

      // Refresh DB quota after successful generation
      await refreshQuota();

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

  const handleSavePrompt = () => {
    if (params.text.trim() && !savedPrompts.includes(params.text)) {
      setSavedPrompts([...savedPrompts, params.text]);
      return true;
    }
    return false;
  };

  const loadPrompt = (prompt: string) => {
    setParams(prev => ({ ...prev, text: prompt }));
  };

  const deletePrompt = (index: number) => {
    setSavedPrompts(savedPrompts.filter((_, i) => i !== index));
  };

  const dismissError = () => setErrorMessage(null);

  // Compute remaining attempts from real DB quota if logged in
  const remainingGenerations = userQuota
    ? Math.max(0, userQuota.max_daily_generations - userQuota.generations_used)
    : null;

  return {
    params,
    setParams,
    savedPrompts,
    audioBlob,
    handleGenerate,
    isGenerating,
    generationTime,
    errorMessage,
    dismissError,
    handleSavePrompt,
    loadPrompt,
    deletePrompt,
    userQuota,
    isAuthenticated,
    remainingGenerations,
    refreshQuota,
  };
}
