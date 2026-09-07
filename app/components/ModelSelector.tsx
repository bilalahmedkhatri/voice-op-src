'use client';

import { memo, useState, useRef, useEffect } from 'react';
import {
  FaBolt,
  FaCloud,
  FaWaveSquare,
  FaChevronDown,
  FaCheck,
  FaMicrochip,
} from 'react-icons/fa';
import { ModelDefinition } from '../lib/tts/types';
import { getAllModels } from '../lib/tts/registry';

interface ModelSelectorProps {
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;
  disabled?: boolean;
}

const modelIcons: Record<string, React.ReactNode> = {
  'kokoro-local': <FaBolt className="text-amber-500" />,
  'kokoro-replicate': <FaCloud className="text-sky-500" />,
  'fish-audio': <FaWaveSquare className="text-cyan-500" />,
};

const ModelSelector = memo(function ModelSelector({
  selectedModelId,
  onSelectModel,
  disabled = false,
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const models: ModelDefinition[] = getAllModels();
  const activeModel =
    models.find((m) => m.id === selectedModelId) || models[0];

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (modelId: string) => {
    onSelectModel(modelId);
    setIsOpen(false);
  };

  const activeIcon =
    modelIcons[activeModel.id] || <FaMicrochip className="text-[#ff9b8f]" />;

  return (
    <div className="relative flex flex-col gap-1.5" ref={dropdownRef}>
      <label className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-800 uppercase tracking-wider">
        <FaMicrochip className="text-[#ff9b8f]" />
        Select AI Voice Model
      </label>

      {/* Dropdown Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
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
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-xs sm:text-sm text-gray-900 truncate">
                {activeModel.name}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200/70">
                {activeModel.badge}
              </span>
            </div>
            <span className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
              {activeModel.description}
            </span>
          </div>
        </div>

        <FaChevronDown
          className={`text-gray-400 text-xs flex-shrink-0 ml-2 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#ff9b8f]' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu Modal */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-40 bg-white rounded-2xl shadow-xl border border-gray-200/80 p-1.5 flex flex-col gap-1 animate-fadeIn">
          {models.map((model) => {
            const isSelected = model.id === selectedModelId;
            const icon =
              modelIcons[model.id] || (
                <FaMicrochip className="text-gray-400" />
              );

            return (
              <button
                key={model.id}
                type="button"
                onClick={() => handleSelect(model.id)}
                className={`w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl text-left transition-all duration-150 cursor-pointer ${
                  isSelected
                    ? 'bg-red-50/70 border border-[#ff9b8f]/40 text-gray-900'
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
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs sm:text-sm text-gray-900 truncate">
                        {model.name}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                          isSelected
                            ? 'bg-[#ff9b8f]/20 text-red-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {model.badge}
                      </span>
                    </div>
                    <span className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
                      {model.description}
                    </span>
                  </div>
                </div>

                {isSelected && (
                  <FaCheck className="text-[#ff9b8f] text-xs flex-shrink-0 ml-2" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
});

export default ModelSelector;
