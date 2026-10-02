import React from 'react';
import { FaChevronDown } from 'react-icons/fa';
import { TTSModel } from '../../hooks/useModels';
import { getModelIcon, getFormattedModelName, getModelDescription } from './modelUtils';

interface ModelTriggerProps {
  activeModel: TTSModel;
  isOpen: boolean;
  disabled?: boolean;
  onClick: () => void;
}

export default function ModelTrigger({
  activeModel,
  isOpen,
  disabled = false,
  onClick,
}: ModelTriggerProps) {
  const activeIcon = getModelIcon(activeModel.provider);
  const activeTitle = getFormattedModelName(activeModel.name, activeModel.provider);
  const activeDescription = getModelDescription(activeModel.provider);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`w-full flex items-center justify-between p-3 rounded-2xl bg-white border transition-all duration-200 cursor-pointer shadow-2xs ${
        isOpen
          ? 'border-[#ff9b8f] ring-2 ring-[#ff9b8f]/20'
          : 'border-gray-200/90 hover:border-[#ffb4a8] hover:bg-gray-50/40'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <div className="flex items-center gap-3 min-w-0 text-left">
        <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 text-base">
          {activeIcon}
        </div>
        <div className="min-w-0 flex flex-col">
          <span className="font-bold text-xs sm:text-sm text-gray-900 truncate">
            {activeTitle}
          </span>
          <span className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
            {activeDescription}
          </span>
        </div>
      </div>

      <FaChevronDown
        className={`text-gray-400 text-xs flex-shrink-0 ml-2 transition-transform duration-200 ${
          isOpen ? 'rotate-180 text-[#ff7d6e]' : ''
        }`}
      />
    </button>
  );
}
