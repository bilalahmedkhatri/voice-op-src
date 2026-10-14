'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import AudioToolbar from './AudioToolbar';
import AudioLibraryTable from './AudioLibraryTable';
import AudioPaginationFooter from './AudioPaginationFooter';
import { AudioLibraryContentProps } from '../types';

export default function AudioLibraryContent(p: AudioLibraryContentProps) {
  return (
    <Card className="p-4 sm:p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-4">
      <AudioToolbar
        search={p.search}
        onSearchChange={p.onSearchChange}
        modelFilter={p.modelFilter}
        onModelFilterChange={p.onModelFilterChange}
      />
      <AudioLibraryTable
        items={p.items}
        playingId={p.playingId}
        loadingId={p.loadingId}
        selectedIds={p.selectedIds}
        authenticated={p.authenticated}
        onToggleSelect={p.onToggleSelect}
        onToggleSelectAll={p.onToggleSelectAll}
        onTogglePlay={p.onTogglePlay}
        onDelete={p.onDelete}
        onCopy={p.onCopy}
        onDownload={p.onDownload}
      />
      <AudioPaginationFooter
        page={p.page}
        totalPages={p.totalPages}
        total={p.total}
        pageSize={p.pageSize}
        onPageChange={p.onPageChange}
      />
    </Card>
  );
}
