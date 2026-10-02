import React from 'react';
import { TTSModel } from '../../hooks/useModels';
import ModelOptionItem from './ModelOptionItem';

interface ModelDropdownProps {
  models: TTSModel[];
  selectedModelId: string;
  onSelect: (modelId: string) => void;
}

export default function ModelDropdown({
  models,
  selectedModelId,
  onSelect,
}: ModelDropdownProps) {
  return (
    <div className="absolute top-full left-0 right-0 mt-1.5 z-40 bg-white rounded-2xl shadow-xl border border-gray-200/80 p-1.5 flex flex-col gap-1 animate-fadeIn max-h-[300px] overflow-y-auto">
      {models.map((model) => (
        <ModelOptionItem
          key={model.name}
          model={model}
          isSelected={model.name === selectedModelId}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
