'use client';

import React from 'react';
import { FiPlay, FiPause } from 'react-icons/fi';
import IconButton from '@/components/ui/IconButton';

interface AudioFilePreviewCellProps {
  id: string;
  promptText: string;
  audioUrl: string;
  isPlaying: boolean;
  isLoading?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  onTogglePlay: (id: string, url: string) => void;
}

export default function AudioFilePreviewCell({
  id,
  promptText,
  audioUrl,
  isPlaying,
  isLoading = false,
  onTogglePlay,
}: AudioFilePreviewCellProps) {
  const displayText = promptText?.trim() || 'Audio Voiceover';

  return (
    <div className="flex items-center gap-3">
      <IconButton
        size="sm"
        variant={isPlaying ? 'primary' : 'secondary'}
        className="!rounded-full shadow-2xs shrink-0"
        isLoading={isLoading}
        icon={isPlaying ? <FiPause className="w-3.5 h-3.5" /> : <FiPlay className="w-3.5 h-3.5 ml-0.5" />}
        title={isLoading ? 'Loading audio...' : isPlaying ? 'Pause' : 'Play'}
        onClick={() => onTogglePlay(id, audioUrl)}
      />
      <div className="flex flex-col min-w-0">
        <span className="text-xs font-semibold text-slate-800 truncate" title={displayText}>
          {displayText}
        </span>
      </div>
    </div>
  );
}
