import React from 'react';
import { FaCheck } from 'react-icons/fa';
import { TTSModel } from '../../hooks/useModels';
import { getModelIcon, getFormattedModelName, getModelDescription } from './modelUtils';

interface ModelOptionItemProps {
  model: TTSModel;
  isSelected: boolean;
  onSelect: (modelId: string) => void;
}

export default function ModelOptionItem({
  model,
  isSelected,
  onSelect,
}: ModelOptionItemProps) {
  const icon = getModelIcon(model.provider);
  const title = getFormattedModelName(model.name, model.provider);
  const description = getModelDescription(model.provider);

  return (
    <button
      type="button"
      onClick={() => onSelect(model.name)}
      className={`w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl text-left transition-all duration-150 cursor-pointer ${
        isSelected
          ? 'bg-orange-50/70 border border-[#ff9b8f]/40 text-slate-900'
          : 'hover:bg-gray-50 text-gray-700 border border-transparent'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm ${
            isSelected ? 'bg-white shadow-2xs' : 'bg-gray-100'
          }`}
        >
          {icon}
        </div>
        <div className="min-w-0 flex flex-col">
          <span className="font-semibold text-xs sm:text-sm text-gray-900 truncate">
            {title}
          </span>
          <span className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
            {description}
          </span>
        </div>
      </div>

      {isSelected && (
        <FaCheck className="text-[#ff7d6e] text-xs flex-shrink-0 ml-2" />
      )}
    </button>
  );
}
