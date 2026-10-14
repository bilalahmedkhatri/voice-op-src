'use client';

import React from 'react';

interface AudioTableHeaderProps {
  allSelected?: boolean;
  partiallySelected?: boolean;
  onToggleAll?: () => void;
  disabled?: boolean;
  hasDuration?: boolean;
  hasSize?: boolean;
}

export default function AudioTableHeader({
  allSelected = false,
  partiallySelected = false,
  onToggleAll,
  disabled = false,
  hasDuration = false,
  hasSize = false,
}: AudioTableHeaderProps = {}) {
  return (
    <thead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 bg-slate-50/50">
      <tr>
        <th className="py-3.5 pl-4 pr-2 w-10">
          <input type="checkbox" aria-label="Select all audio on this page" checked={allSelected}
            ref={element => { if (element) element.indeterminate = partiallySelected; }}
            onChange={onToggleAll} disabled={disabled}
            className="h-4 w-4 cursor-pointer accent-[#ff7d6e] disabled:cursor-not-allowed" />
        </th>
        <th className="py-3.5 pl-4 pr-3 text-left min-w-[280px]">AUDIO FILE &amp; PREVIEW</th>
        <th className="py-3.5 px-3 text-left min-w-[130px]">VOICE MODEL</th>
        {hasDuration && <th className="py-3.5 px-3 text-left min-w-[80px]">DURATION</th>}
        <th className="py-3.5 px-3 text-left min-w-[100px]">DATE CREATED</th>
        {hasSize && <th className="py-3.5 px-3 text-left min-w-[80px]">SIZE</th>}
        <th className="py-3.5 px-4 text-left min-w-[120px]">ACTIONS</th>
      </tr>
    </thead>
  );
}
