import { useState, useEffect, useCallback, useRef } from 'react';
import { getVoiceSamples, VoiceSample } from '../lib/voiceoverApi';

export function useVoiceSamples(modelId?: string) {
  const [voices, setVoices] = useState<VoiceSample[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFirstLoadRef = useRef(true);

  const fetchVoices = useCallback(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      if (isFirstLoadRef.current) {
        setLoading(true);
      } else {
        setIsSwitching(true);
      }
      setError(null);

      const samples = await getVoiceSamples(modelId);
      clearTimeout(timeoutId);

      setVoices(samples);
      isFirstLoadRef.current = false;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Request timeout - please try again');
      } else {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to load voices';
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
      setIsSwitching(false);
    }
  }, [modelId]);

  useEffect(() => {
    fetchVoices();
  }, [fetchVoices]);

  return { voices, loading, isSwitching, error, refetch: fetchVoices };
}
