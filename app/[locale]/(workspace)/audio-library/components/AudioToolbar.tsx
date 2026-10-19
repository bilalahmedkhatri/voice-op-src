'use client';

import {useCopy} from '@/i18n/copy';

import { FiSearch, FiChevronDown } from 'react-icons/fi';

interface AudioToolbarProps {
  search: string;
  onSearchChange: (val: string) => void;
  modelFilter: string;
  onModelFilterChange: (val: string) => void;
}

export default function AudioToolbar({
  search,
  onSearchChange,
  modelFilter,
  onModelFilterChange,
}: AudioToolbarProps) {
  const copy = useCopy();


  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
      <h2 className="text-base font-bold text-slate-900 tracking-wide">
        {copy("ALL AUDIOS")}</h2>
      <div className="flex items-center gap-3">
        <div className="relative">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={copy("Search audio files...")}
            className="pl-9 pr-3 py-1.5 text-xs bg-slate-50/70 border border-slate-200 rounded-xl w-48 sm:w-60 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#ff7d6e] transition-all"
          />
        </div>
        <div className="relative">
          <select
            value={modelFilter}
            onChange={(e) => onModelFilterChange(e.target.value)}
            className="appearance-none pl-3 pr-8 py-1.5 text-xs bg-slate-50/70 border border-slate-200 rounded-xl text-slate-700 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#ff7d6e] cursor-pointer transition-all"
          >
            <option value="all">{copy("All Voice Models")}</option>
            <option value="gemini">{copy("Gemini TTS")}</option>
            <option value="elevenlabs">{copy("ElevenLabs")}</option>
            <option value="fish">{copy("Fish Audio")}</option>
          </select>
          <FiChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
