import { useState, useEffect, useCallback, useRef } from 'react';
import { getVoiceSamples, VoiceSample } from '../lib/voiceoverApi';

export function useVoiceSamples(modelId?: string) {
  const [voices, setVoices] = useState<VoiceSample[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  
  const isFirstLoadRef = useRef(true);
  const lastSearchQuery = useRef('');
  const lastModelId = useRef('');

  const fetchVoices = useCallback(async (reset = true, offset = 0, query = '') => {
    if (!modelId) return;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      if (reset) {
        if (isFirstLoadRef.current) {
          setLoading(true);
        } else {
          setIsSwitching(true);
          setLoading(true); // Trigger skeleton for resets (search/model change)
        }
      } else {
        setLoadingMore(true);
      }
      setError(null);

      if (reset) {
        // Reduced artificial delay slightly for better UX on search
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      let url = `/api/voiceover/voices?model=${encodeURIComponent(modelId)}&limit=10&offset=${offset}`;
      if (query) {
        url += `&search=${encodeURIComponent(query)}`;
      }

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!res.ok) {
        throw new Error('Failed to load voices');
      }
      const data = await res.json();
      
      if (data.voices && Array.isArray(data.voices)) {
        const mappedVoices: VoiceSample[] = data.voices.map((v: any) => {
          const backendUrl = v.sample_audio_url || '';
          const sampleUrl = (backendUrl.startsWith('http://') || backendUrl.startsWith('https://')) 
            ? backendUrl 
            : `/api/voiceover/sample?model=${encodeURIComponent(modelId)}&voice=${encodeURIComponent(v.name)}`;

          return {
            voice_id: v.name,
            voice_name: v.name,
            gender: v.gender || 'Unknown',
            language: 'EN',
            accent: 'Default',
            description: '',
            sample_url: sampleUrl
          };
        });
        
        setVoices(prev => reset ? mappedVoices : [...prev, ...mappedVoices]);
        setTotalCount(data.total_count || 0);
      } else {
        if (reset) {
          setVoices([]);
          setTotalCount(0);
        }
      }
      
      isFirstLoadRef.current = false;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Request timeout - please try again');
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load voices';
        setError(errorMessage);
      }
    } finally {
      if (reset) {
        setLoading(false);
        setIsSwitching(false);
      } else {
        setLoadingMore(false);
      }
    }
  }, [modelId]);

  useEffect(() => {
    if (!modelId) return;

    // If model changed, fetch immediately
    if (lastModelId.current !== modelId) {
       lastModelId.current = modelId;
       lastSearchQuery.current = '';
       setSearchQuery(''); // Sync state, won't trigger another fetch because of lastSearchQuery check
       fetchVoices(true, 0, '');
       return;
    }

    // If search changed, debounce
    if (lastSearchQuery.current !== searchQuery) {
      const timeoutId = setTimeout(() => {
        lastSearchQuery.current = searchQuery;
        fetchVoices(true, 0, searchQuery);
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [modelId, searchQuery, fetchVoices]);

  const loadMore = useCallback(() => {
    if (loading || loadingMore || voices.length >= totalCount) return;
    fetchVoices(false, voices.length, searchQuery);
  }, [loading, loadingMore, voices.length, totalCount, searchQuery, fetchVoices]);

  const hasMore = voices.length < totalCount;

  return { 
    voices, 
    loading, 
    loadingMore,
    isSwitching, 
    error, 
    searchQuery,
    setSearchQuery,
    hasMore,
    loadMore,
    refetch: () => fetchVoices(true, 0, searchQuery) 
  };
}
