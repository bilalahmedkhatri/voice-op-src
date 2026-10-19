'use client';

import {useCopy} from '@/i18n/copy';

import { ownerFetch as fetch } from '@/app/lib/ownerStorage';

import React, { useState } from 'react';
import AudioLibraryContent from './AudioLibraryContent';
import AudioDeleteModal from './AudioDeleteModal';
import PendingAudioJobs from '@/app/components/PendingAudioJobs';
import { useAudioLibraryData } from '../hooks/useAudioLibraryData';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { useAudioSelection } from '../hooks/useAudioSelection';
import { downloadAudio } from '../utils/formatters';
import type { AudioItem } from '../types';

export default function AudioLibraryClient() {
  const copy = useCopy();


  const data = useAudioLibraryData();
  const player = useAudioPlayer();
  const selection = useAudioSelection();
  const [deleteIds, setDeleteIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!deleteIds.length || isDeleting) return;
    setIsDeleting(true);
    try {
      if (await data.deleteAudio(deleteIds)) {
        if (deleteIds.includes(player.playingId || '') || deleteIds.includes(player.loadingId || '')) player.stop();
        selection.selectedIds.filter(id => deleteIds.includes(id)).forEach(selection.toggleSelect);
        setDeleteIds([]);
      }
    } finally { setIsDeleting(false); }
  };

  const getAudioUrl = async (id: string, existingUrl?: string) => {
    if (existingUrl) return existingUrl;
    try {
      const res = await fetch(`/api/audio-library?id=${encodeURIComponent(id)}`);
      const json = await res.json();
      return json.audio_url || '';
    } catch {
      return '';
    }
  };

  const handlePlay = async (id: string, url: string) => {
    await player.playAudio(id, () => getAudioUrl(id, url));
  };

  const handleDownload = async (item: AudioItem) => {
    const audioUrl = await getAudioUrl(item.id, item.audio_url);
    if (audioUrl) {
      downloadAudio(audioUrl, item.filename || `${item.voice_name || 'voice'}_audio.mp3`);
    }
  };

  const allItemIds = data.items.map((i) => i.id);

  return (
    <div className="space-y-6 mx-auto">
      <PendingAudioJobs />
      {selection.selectedIds.length > 0 && <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="text-slate-600">{selection.selectedIds.length} {copy(" selected")}</span>
        <button type="button" disabled={isDeleting} onClick={() => { data.clearDeleteError(); setDeleteIds([...selection.selectedIds]); }}
          className="rounded-lg bg-[#ff7d6e] px-3 py-2 font-semibold text-slate-900 disabled:opacity-50">
          {copy("Delete selected (")}{selection.selectedIds.length})
        </button>
        <button type="button" disabled={isDeleting} onClick={selection.clearSelection} className="text-slate-600 underline">{copy("Clear selection")}</button>
      </div>}
      <AudioLibraryContent
        {...data}
        onSearchChange={value => { selection.clearSelection(); data.setPage(1); data.setSearch(value); }}
        onModelFilterChange={value => { selection.clearSelection(); data.setPage(1); data.setModelFilter(value); }}
        onPageChange={data.setPage}
        playingId={player.playingId}
        loadingId={player.loadingId}
        selectedIds={selection.selectedIds}
        onToggleSelect={selection.toggleSelect}
        onToggleSelectAll={() => selection.toggleSelectAll(allItemIds)}
        onTogglePlay={handlePlay}
        onDelete={id => { data.clearDeleteError(); setDeleteIds([id]); }}
        onCopy={async (url) => {
          navigator.clipboard.writeText(url || window.location.href);
        }}
        onDownload={handleDownload}
      />
      <AudioDeleteModal isOpen={deleteIds.length > 0} onClose={() => { if (!isDeleting) setDeleteIds([]); }}
        onConfirm={confirmDelete} isDeleting={isDeleting} error={data.deleteError} count={deleteIds.length} />
    </div>
  );
}
