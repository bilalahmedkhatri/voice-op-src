'use client';

import React from 'react';
import AudioFilePreviewCell from './AudioFilePreviewCell';
import AudioModelCell from './AudioModelCell';
import AudioActionsCell from './AudioActionsCell';
import { formatDuration, formatDate, formatFileSize } from '../utils/formatters';
import { AudioItem } from '../types';

interface AudioTableRowProps {
  item: AudioItem;
  isPlaying: boolean;
  isLoading?: boolean;
  showDuration?: boolean;
  showSize?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  onTogglePlay: (id: string, url: string) => void;
  onDelete: (id: string) => void;
  onCopy: () => void;
  onDownload: () => void;
}

export default function AudioTableRow({
  item,
  isPlaying,
  isLoading,
  showDuration = false,
  showSize = false,
  isSelected,
  onToggleSelect,
  onTogglePlay,
  onDelete,
  onCopy,
  onDownload,
}: AudioTableRowProps) {
  return (
    <tr className={`border-b border-slate-100/80 transition-colors ${isSelected ? 'bg-[#fff8f6]' : 'hover:bg-slate-50/60'}`}>
      <td className="py-3.5 pl-4 pr-2 w-10">
        <input type="checkbox" aria-label={`Select audio: ${item.prompt_text || item.voice_name || 'Voiceover'}`}
          checked={Boolean(isSelected)} onChange={() => onToggleSelect?.(item.id)}
          className="h-4 w-4 cursor-pointer accent-[#ff7d6e]" />
      </td>
      <td className="py-3.5 pl-4 pr-3 min-w-[280px]">
        <AudioFilePreviewCell
          id={item.id}
          promptText={item.prompt_text}
          audioUrl={item.audio_url}
          isPlaying={isPlaying}
          isLoading={isLoading}
          onTogglePlay={onTogglePlay}
        />
      </td>
      <td className="py-3.5 px-3 min-w-[130px]"><AudioModelCell modelName={item.model_name} voiceName={item.voice_name} /></td>
      {showDuration && (
        <td className="py-3.5 px-3 text-xs font-medium text-slate-600 min-w-[80px]">
          {formatDuration(item.duration_sec)}
        </td>
      )}
      <td className="py-3.5 px-3 text-xs font-medium text-slate-600 min-w-[100px]">{formatDate(item.created_at)}</td>
      {showSize && (
        <td className="py-3.5 px-3 text-xs font-medium text-slate-600 min-w-[80px]">
          {formatFileSize(item.size_bytes)}
        </td>
      )}
      <td className="py-3.5 px-4 min-w-[120px]"><AudioActionsCell id={item.id} onDownload={onDownload} onCopy={onCopy} onDelete={onDelete} /></td>
    </tr>
  );
}
