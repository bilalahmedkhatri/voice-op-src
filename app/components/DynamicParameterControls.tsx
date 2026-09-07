'use client';

import { memo } from 'react';
import { FaSlidersH, FaInfoCircle } from 'react-icons/fa';
import { ModelDefinition } from '../lib/tts/types';

interface DynamicParameterControlsProps {
  model: ModelDefinition;
  params: Record<string, any>;
  onParamChange: (paramId: string, value: any) => void;
  disabled?: boolean;
}

const DynamicParameterControls = memo(function DynamicParameterControls({
  model,
  params,
  onParamChange,
  disabled = false,
}: DynamicParameterControlsProps) {
  if (!model || !model.parameters || model.parameters.length === 0) {
    return null;
  }

  return (
    <div className="pt-2.5 border-t border-gray-100 flex flex-col gap-3">
      <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-gray-700">
        <div className="flex items-center gap-1.5">
          <FaSlidersH className="text-gray-500" />
          <span>Model Parameters</span>
        </div>
        <span className="text-[11px] font-normal text-gray-500">
          {model.name}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {model.parameters.map((param) => {
          const currentValue =
            params[param.id] !== undefined ? params[param.id] : param.defaultValue;

          if (param.type === 'slider') {
            const min = param.min ?? 0;
            const max = param.max ?? 1;
            const step = param.step ?? 0.1;
            const unit = param.unit ?? '';

            return (
              <div key={param.id} className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-xs sm:text-sm font-medium text-gray-700">
                  <label
                    htmlFor={`param-${param.id}`}
                    className="flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{param.label}</span>
                    {param.description && (
                      <span
                        title={param.description}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <FaInfoCircle className="text-[10px]" />
                      </span>
                    )}
                  </label>

                  {/* Interactive Editable Number Input */}
                  <div className="flex items-center justify-center bg-red-50/90 px-2 py-0.5 rounded-md border border-red-200/80 focus-within:ring-2 focus-within:ring-[#ff9b8f]/30 focus-within:border-[#ff9b8f] transition-all">
                    <input
                      type="number"
                      min={min}
                      max={max}
                      step={step}
                      disabled={disabled}
                      value={currentValue}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val)) {
                          const clamped = Math.max(min, Math.min(max, val));
                          onParamChange(param.id, clamped);
                        }
                      }}
                      className="w-10 text-center bg-transparent text-xs font-bold text-red-600 font-mono outline-none border-none p-0 cursor-text"
                      title="Type value or use up/down arrow keys"
                    />
                    {unit && (
                      <span className="text-[11px] font-bold text-red-600 font-mono select-none">
                        {unit}
                      </span>
                    )}
                  </div>
                </div>

                <input
                  id={`param-${param.id}`}
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={currentValue}
                  disabled={disabled}
                  style={{ accentColor: '#ff7d6e' }}
                  onChange={(e) =>
                    onParamChange(param.id, parseFloat(e.target.value))
                  }
                  className="theme-range-slider w-full h-2 rounded-full appearance-none bg-red-100 outline-none cursor-pointer disabled:opacity-50"
                />

                <div className="flex justify-between text-[11px] text-gray-400 font-mono">
                  <span>
                    {min}
                    {unit}
                  </span>
                  <span>
                    {((min + max) / 2).toFixed(1)}
                    {unit}
                  </span>
                  <span>
                    {max}
                    {unit}
                  </span>
                </div>
              </div>
            );
          }

          if (param.type === 'toggle') {
            return (
              <div key={param.id} className="flex justify-between items-center py-1">
                <label
                  htmlFor={`param-${param.id}`}
                  className="text-xs sm:text-sm font-medium text-gray-700 cursor-pointer"
                >
                  {param.label}
                </label>
                <input
                  id={`param-${param.id}`}
                  type="checkbox"
                  checked={!!currentValue}
                  disabled={disabled}
                  onChange={(e) => onParamChange(param.id, e.target.checked)}
                  className="w-4 h-4 accent-[#ff7d6e] cursor-pointer rounded"
                />
              </div>
            );
          }

          if (param.type === 'select' && param.options) {
            return (
              <div key={param.id} className="flex justify-between items-center py-1">
                <label
                  htmlFor={`param-${param.id}`}
                  className="text-xs sm:text-sm font-medium text-gray-700"
                >
                  {param.label}
                </label>
                <select
                  id={`param-${param.id}`}
                  value={currentValue}
                  disabled={disabled}
                  onChange={(e) => onParamChange(param.id, e.target.value)}
                  className="text-xs border border-gray-200 rounded px-2 py-1 bg-white outline-none focus:border-[#ff9b8f]"
                >
                  {param.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
});

export default DynamicParameterControls;
