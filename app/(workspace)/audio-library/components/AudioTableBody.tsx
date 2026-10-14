'use client';

import React from 'react';
import AudioTableRow from './AudioTableRow';
import AudioEmptyState from './AudioEmptyState';
import { AudioItem } from '../types';

interface Props {
  items: AudioItem[];
  playingId: string | null;
  loadingId?: string | null;
  hasDuration?: boolean;
  hasSize?: boolean;
  selectedIds: string[];
  authenticated: boolean;
  onToggleSelect: (id: string) => void;
  onTogglePlay: (id: string, url: string) => void;
  onDelete: (id: string) => void;
  onCopy: (url: string) => void;
  onDownload: (item: AudioItem) => void;
}

export default function AudioTableBody({
  items,
  playingId,
  loadingId,
  hasDuration = false,
  hasSize = false,
  selectedIds,
  authenticated,
  onToggleSelect,
  onTogglePlay,
  onDelete,
  onCopy,
  onDownload,
}: Props) {
  const colSpan = 5 + (hasDuration ? 1 : 0) + (hasSize ? 1 : 0);

  if (items.length === 0) {
    return (
      <tbody><tr><td colSpan={colSpan} className="p-0"><AudioEmptyState authenticated={authenticated} /></td></tr></tbody>
    );
  }
  return (
    <tbody>
      {items.map((item) => (
        <AudioTableRow
          key={item.id}
          item={item}
          isPlaying={playingId === item.id}
          isLoading={loadingId === item.id}
          showDuration={hasDuration}
          showSize={hasSize}
          isSelected={selectedIds.includes(item.id)}
          onToggleSelect={onToggleSelect}
          onTogglePlay={onTogglePlay}
          onDelete={onDelete}
          onCopy={() => onCopy(item.audio_url)}
          onDownload={() => onDownload(item)}
        />
      ))}
    </tbody>
  );
}
