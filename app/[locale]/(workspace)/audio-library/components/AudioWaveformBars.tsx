'use client';

import React from 'react';

interface AudioWaveformBarsProps {
  isPlaying: boolean;
}

const barHeights = [40, 65, 30, 85, 55, 95, 45, 75, 35, 90, 60, 80, 50, 70, 30];

export default function AudioWaveformBars({ isPlaying }: AudioWaveformBarsProps) {
  return (
    <div className="flex items-center gap-[2.5px] h-7 px-1.5 select-none">
      {barHeights.map((h, i) => (
        <span
          key={i}
          className={`w-[2px] rounded-full transition-all duration-300 ${
            isPlaying ? 'bg-[#ff7d6e] animate-pulse' : 'bg-[#f4a298]'
          }`}
          style={{
            height: isPlaying ? `${Math.max(20, (h + (i % 3) * 20) % 100)}%` : `${h}%`,
            animationDelay: `${i * 60}ms`,
          }}
        />
      ))}
    </div>
  );
}
