'use client';

import { useState, useEffect, useRef } from 'react';
import { VoiceParams } from '../types';
import { promptStorage } from '../lib/promptStorage';
import { usageLimit } from '../lib/usageLimit';
import { isDatabaseEnabled } from '../lib/config';
import { saveLocalHistoryItem } from '../lib/localHistoryStorage';
import { getModelDefinition, DEFAULT_MODEL_ID } from '../lib/tts/registry';

export function useVoiceGenerator() {
  const dbEnabled = typeof window !== 'undefined' ? isDatabaseEnabled() : false;
  
  // Initialize usage limit status (only relevant if online DB limits active)
  const initialUsageStatus = typeof window !== 'undefined' && dbEnabled ? usageLimit.canGenerate() : { remaining: 999, resetAt: null };
  const initialResetTime = typeof window !== 'undefined' && initialUsageStatus.resetAt ? usageLimit.formatTimeUntilReset() : null;

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
  const [remainingAttempts, setRemainingAttempts] = useState<number>(initialUsageStatus.remaining);
  const [resetTime, setResetTime] = useState<string | null>(initialResetTime);
  const generationControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const prompts = promptStorage.load();
    setSavedPrompts(prompts);
    
    if (dbEnabled) {
      updateUsageStatus();
      const intervalId = setInterval(() => {
        updateUsageStatus();
      }, 1000);
      return () => clearInterval(intervalId);
    } else {
      setRemainingAttempts(999);
      setResetTime(null);
    }
  }, [dbEnabled]);

  const updateUsageStatus = () => {
    if (!dbEnabled) {
      setRemainingAttempts(999);
      setResetTime(null);
      return;
    }
    const { remaining, resetAt } = usageLimit.canGenerate();
    setRemainingAttempts(remaining);
    if (resetAt) {
      setResetTime(usageLimit.formatTimeUntilReset());
    } else {
      setResetTime(null);
    }
  };

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

    // In online mode only, check usage limit
    if (dbEnabled) {
      const { allowed } = usageLimit.canGenerate();
      if (!allowed) {
        const timeLeft = usageLimit.formatTimeUntilReset();
        setErrorMessage(`Generation limit reached. You've used all ${usageLimit.getMaxAttempts()} attempts. Please try again in ${timeLeft}.`);
        setRemainingAttempts(0);
        setResetTime(timeLeft);
        return;
      }
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
          const error = await response.json();
          errorMsg = error.error || errorMsg;
        } catch {
          errorMsg = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();

      const audioResponse = await fetch(data.audio_url, { signal: controller.signal });
      
      if (!audioResponse.ok) {
        throw new Error(`Failed to download audio file: ${audioResponse.status} ${audioResponse.statusText}`);
      }
      
      const downloadedBlob = await audioResponse.blob();
      setAudioBlob(downloadedBlob);

      const elapsed = Math.round((performance.now() - startTime) / 100) / 10;
      setGenerationTime(elapsed);

      // Save to local IndexedDB storage (instant offline history)
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

      if (dbEnabled) {
        usageLimit.incrementUsage();
        updateUsageStatus();
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

      const rawMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      const errorMap: Record<string, string> = {
        '404': 'The selected voice model is not available. Please try a different voice or contact support.',
        'Failed to download audio': 'The audio file could not be downloaded. Please verify the backend configuration.',
        'Failed to fetch': 'Unable to connect to the voiceover API. Make sure the backend server is running at http://localhost:8000.',
      };

      const uiMessage = Object.keys(errorMap).find(key => rawMessage.includes(key))
        ? errorMap[Object.keys(errorMap).find(key => rawMessage.includes(key))!]
        : `Error generating voiceover: ${rawMessage}`;
      
      setErrorMessage(uiMessage);
      generationControllerRef.current = null;
    }
  };

  const handleSavePrompt = () => {
    if (params.text.trim() && !savedPrompts.includes(params.text)) {
      setSavedPrompts([...savedPrompts, params.text]);
      return true; // Indicate success
    }
    return false; // Already saved or empty
  };

  const loadPrompt = (prompt: string) => {
    setParams(prev => ({ ...prev, text: prompt }));
  };

  const deletePrompt = (index: number) => {
    setSavedPrompts(savedPrompts.filter((_, i) => i !== index));
  };

  const dismissError = () => setErrorMessage(null);

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
    remainingAttempts: dbEnabled ? remainingAttempts : 999,
    resetTime: dbEnabled ? resetTime : null,
  };
}
