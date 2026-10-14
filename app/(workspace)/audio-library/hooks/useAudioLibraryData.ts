'use client';

import { ownerFetch as fetch } from '@/app/lib/ownerStorage';

import { useState, useEffect, useCallback, useRef } from 'react';
import { AudioItem, AudioLibraryApiResponse } from '../types';
import { currentOwnerScope } from '@/app/lib/ownerStorage';
import { isDatabaseEnabled } from '@/app/lib/config';
import { getLocalHistoryItems, deleteLocalHistoryItem } from '@/app/lib/localHistoryStorage';
import { removePendingAudioJob } from '@/app/lib/pendingAudioJobs';
import { audioMetadata } from '@/app/lib/audioMetadata';

export function useAudioLibraryData() {
  const [items, setItems] = useState<AudioItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [modelFilter, setModelFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(true);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const requestId = useRef(0);
  const blobUrls = useRef<Record<string, string>>({});

  const fetchAudios = useCallback(async () => {
    const version = ++requestId.current;
    const scope = currentOwnerScope();
    try {
      setLoading(true);
      if (!isDatabaseEnabled()) {
        const rows = await getLocalHistoryItems();
        if (version !== requestId.current || currentOwnerScope() !== scope) return;
        const filtered = rows.filter(item => `${item.voice_name} ${item.prompt_text} ${item.model_name}`.toLowerCase().includes(search.toLowerCase())
          && (modelFilter === 'all' || item.model_id.toLowerCase().includes(modelFilter.toLowerCase())));
        setAuthenticated(true);
        setTotal(filtered.length);
        setTotalPages(Math.max(1, Math.ceil(filtered.length / pageSize)));
        const localItems = await Promise.all(filtered.slice((page - 1) * pageSize, page * pageSize).map(async item => {
          const metadata = audioMetadata(new Uint8Array(await item.audioBlob.slice(0, 8192).arrayBuffer()), item.audioBlob.size);
          if (!blobUrls.current[item.id]) blobUrls.current[item.id] = URL.createObjectURL(item.audioBlob);
          return { ...item, user_id: scope, audio_url: blobUrls.current[item.id], duration_sec: item.duration_sec ?? metadata.duration_sec,
            size_bytes: item.audioBlob.size,
            generation_time_sec: item.generation_time_sec ?? null, parameters: item.parameters || {} };
        }));
        if (version !== requestId.current || currentOwnerScope() !== scope) return;
        setItems(localItems);
        return;
      }
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        search,
        model: modelFilter,
      });
      const res = await fetch(`/api/audio-library?${params.toString()}`);
      if (!res.ok) throw new Error('Fetch failed');
      const data: AudioLibraryApiResponse = await res.json();
      if (version !== requestId.current || currentOwnerScope() !== scope) return;
      setAuthenticated(data.authenticated);
      setItems(data.items || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Audio fetch error:', err);
    } finally {
      if (version === requestId.current) setLoading(false);
    }
  }, [page, pageSize, search, modelFilter]);

  useEffect(() => {
    const refresh = () => { void fetchAudios(); };
    refresh();
    window.addEventListener('audio-library-updated', refresh);
    window.addEventListener('focus', refresh);
    return () => { window.removeEventListener('audio-library-updated', refresh); window.removeEventListener('focus', refresh); };
  }, [fetchAudios]);

  useEffect(() => {
    const urls = blobUrls.current;
    return () => { Object.values(urls).forEach(url => URL.revokeObjectURL(url)); };
  }, []);

  const deleteAudio = async (id: string | string[]) => {
    const ids = [...new Set(Array.isArray(id) ? id : [id])];
    if (!ids.length) return false;
    const scope = currentOwnerScope();
    setDeleteError(null);
    try {
      if (!isDatabaseEnabled()) {
        await deleteLocalHistoryItem(ids, scope);
      } else {
        const query = new URLSearchParams(ids.length === 1 ? { id: ids[0] } : { ids: ids.join(',') });
        const res = await fetch(`/api/audio-library?${query}`, { method: 'DELETE' });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Unable to delete this audio. Please try again.');
        }
        // Remove the matching account-scoped offline copy without undoing server success.
        await deleteLocalHistoryItem(ids, scope).catch(() => {});
      }
      if (currentOwnerScope() !== scope) throw new Error('Your account changed. Please refresh.');
      ++requestId.current;
      for (const itemId of ids) {
        if (blobUrls.current[itemId]) { URL.revokeObjectURL(blobUrls.current[itemId]); delete blobUrls.current[itemId]; }
        removePendingAudioJob(itemId);
      }
      setItems(prev => prev.filter(item => !ids.includes(item.id)));
      const remaining = Math.max(0, total - ids.length);
      const lastPage = Math.max(1, Math.ceil(remaining / pageSize));
      setTotal(remaining);
      setTotalPages(lastPage);
      if (page > lastPage) setPage(lastPage);
      else await fetchAudios();
      return true;
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Unable to delete this audio. Please try again.');
    }
    return false;
  };

  return {
    items,
    total,
    totalPages,
    page,
    setPage,
    pageSize,
    search,
    setSearch,
    modelFilter,
    setModelFilter,
    loading,
    authenticated,
    deleteAudio,
    deleteError,
    clearDeleteError: () => setDeleteError(null),
    refresh: fetchAudios,
  };
}
