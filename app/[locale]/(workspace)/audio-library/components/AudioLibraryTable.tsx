'use client';

import React from 'react';
import AudioTableHeader from './AudioTableHeader';
import AudioTableBody from './AudioTableBody';
import { AudioItem } from '../types';

interface AudioLibraryTableProps {
  items: AudioItem[];
  playingId: string | null;
  loadingId?: string | null;
  selectedIds: string[];
  authenticated: boolean;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onTogglePlay: (id: string, url: string) => void;
  onDelete: (id: string) => void;
  onCopy: (url: string) => void;
  onDownload: (item: AudioItem) => void;
}

export default function AudioLibraryTable({
  items,
  playingId,
  loadingId,
  selectedIds,
  authenticated,
  onToggleSelect,
  onToggleSelectAll,
  onTogglePlay,
  onDelete,
  onCopy,
  onDownload,
}: AudioLibraryTableProps) {
  const allSelected = items.length > 0 && items.every(item => selectedIds.includes(item.id));
  const partiallySelected = !allSelected && items.some(item => selectedIds.includes(item.id));
  const hasDuration = true;
  const hasSize = true;

  return (
    <div className="overflow-x-auto -mx-4 sm:-mx-6">
      <table className="w-full text-left border-collapse">
        <AudioTableHeader
          allSelected={allSelected}
          partiallySelected={partiallySelected}
          disabled={!items.length}
          onToggleAll={onToggleSelectAll}
          hasDuration={hasDuration}
          hasSize={hasSize}
        />
        <AudioTableBody
          items={items}
          playingId={playingId}
          loadingId={loadingId}
          hasDuration={hasDuration}
          hasSize={hasSize}
          selectedIds={selectedIds}
          authenticated={authenticated}
          onToggleSelect={onToggleSelect}
          onTogglePlay={onTogglePlay}
          onDelete={onDelete}
          onCopy={onCopy}
          onDownload={onDownload}
        />
      </table>
    </div>
  );
}
