'use client';

import { memo, useState, useRef, useEffect } from 'react';
import { FaMicrochip } from 'react-icons/fa';
import { TTSModel } from '../hooks/useModels';
import { ModelTrigger, ModelDropdown, ModelSkeleton } from './model-selector';

export interface ModelSelectorProps {
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;
  apiModels: TTSModel[];
  apiModelsLoading?: boolean;
  disabled?: boolean;
}

const ModelSelector = memo(function ModelSelector({
  selectedModelId,
  onSelectModel,
  apiModels,
  apiModelsLoading = false,
  disabled = false,
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const activeModel = apiModels.find((m) => m.name === selectedModelId) || apiModels[0];

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

  if (apiModelsLoading || !activeModel) {
    return <ModelSkeleton />;
  }

  return (
    <div className="relative flex flex-col gap-1.5" ref={dropdownRef}>
      <label className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-800 uppercase tracking-wider">
        <FaMicrochip className="text-[#ff9b8f]" />
        Select AI Voice Model
      </label>

      {/* Dropdown Trigger Button */}
      <ModelTrigger
        activeModel={activeModel}
        isOpen={isOpen}
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
      />

      {/* Dropdown Menu Modal */}
      {isOpen && (
        <ModelDropdown
          models={apiModels}
          selectedModelId={selectedModelId}
          onSelect={handleSelect}
        />
      )}
    </div>
  );
});

export default ModelSelector;
