import React from 'react';

export interface FilterTabProps {
  label: string;
  count?: number;
  isActive: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  size?: 'sm' | 'md';
  className?: string;
}

export default function FilterTab({
  label,
  count,
  isActive,
  onClick,
  icon,
  size = 'md',
  className = '',
}: FilterTabProps) {
  const sizeClasses =
    size === 'sm' ? 'px-2.5 py-1 text-xs rounded-lg gap-1' : 'px-3.5 py-1.5 text-xs font-semibold rounded-xl gap-1.5';

  const stateClasses = isActive
    ? 'bg-gradient-to-r from-[#ff9b8f] to-[#ff7d6e] text-white shadow-xs border border-transparent'
    : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center transition-all cursor-pointer select-none flex-shrink-0 font-medium ${sizeClasses} ${stateClasses} ${className}`.trim()}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{label}</span>
      {typeof count === 'number' && (
        <span
          className={`ml-1 text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
            isActive ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}
