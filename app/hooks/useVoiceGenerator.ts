'use client';

import { useState, useEffect, useRef } from 'react';
import { VoiceParams } from '../types';
import { promptStorage } from '../lib/promptStorage';
import { usageLimit } from '../lib/usageLimit';

export function useVoiceGenerator() {
  // Initialize usage limit status immediately before any state
  const initialUsageStatus = typeof window !== 'undefined' ? usageLimit.canGenerate() : { remaining: 3, resetAt: null };
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
    
    // Initialize usage limit status
    updateUsageStatus();

    // Update countdown timer every second
    const intervalId = setInterval(() => {
      updateUsageStatus();
    }, 1000); // 1 second

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const updateUsageStatus = () => {
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

    // Check usage limit
    const { allowed } = usageLimit.canGenerate();
    if (!allowed) {
      const timeLeft = usageLimit.formatTimeUntilReset();
      setErrorMessage(`Generation limit reached. You've used all ${usageLimit.getMaxAttempts()} attempts. Please try again in ${timeLeft}.`);
      setRemainingAttempts(0);
      setResetTime(timeLeft);
      return;
    }

    setErrorMessage(null);
    const startTime = performance.now();

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
          model_id: params.modelId || 'kokoro-82m',
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

      // Increment usage counter on successful generation
      usageLimit.incrementUsage();
      updateUsageStatus();

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
    remainingAttempts,
    resetTime,
  };
}
