import { useState, useEffect, useCallback } from 'react';

export interface TTSModel {
  name: string;
  provider: string;
  is_local: boolean;
}

export function useModels() {
  const [models, setModels] = useState<TTSModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchModels = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/voiceover/models');
      if (!res.ok) {
        throw new Error('Failed to load TTS models');
      }
      const data = await res.json();
      if (data.models && Array.isArray(data.models)) {
        setModels(data.models);
      } else {
        setModels([]);
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching models');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  return { models, loading, error, refetch: fetchModels };
}
