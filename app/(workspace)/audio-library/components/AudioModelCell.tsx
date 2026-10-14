'use client';

import React from 'react';

interface AudioModelCellProps {
  modelName: string;
  voiceName: string;
}

export default function AudioModelCell({ modelName, voiceName }: AudioModelCellProps) {
  const getModelLabel = () => {
    const m = (modelName || '').toLowerCase();
    if (m.includes('eleven')) return 'ElevenLabs';
    if (m.includes('fish')) return 'Fish Audio';
    if (m.includes('kokoro')) return 'Kokoro';
    return 'Gemini TTS';
  };

  return (
    <div className="flex flex-col min-w-0">
      <span className="text-xs font-semibold text-slate-800 truncate">
        {getModelLabel()}
      </span>
      {voiceName && (
        <span className="text-[11px] font-medium text-slate-500 truncate">
          {voiceName}
        </span>
      )}
    </div>
  );
}
