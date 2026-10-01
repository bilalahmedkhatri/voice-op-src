'use client';

import { useState, memo } from 'react';
import { FaEdit, FaTrash, FaFont, FaExclamationTriangle } from 'react-icons/fa';

interface TextInputProps {
  text: string;
  onTextChange: (text: string) => void;
  disabled?: boolean;
}

const TextInput = memo(function TextInput({
  text,
  onTextChange,
  disabled = false,
}: TextInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const charCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).filter(word => word.length > 0).length : 0;
  const isLargeText = charCount > 2500;

  return (
    <div className="relative flex flex-col h-full justify-between gap-3">
      {/* 1. Header with Title & Compact Actions */}
      <div className="flex justify-between items-center flex-wrap gap-2">
        <label className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-800 uppercase tracking-wider">
          <FaEdit className="text-base text-[#ff7d6e]" />
          Enter Your Text
        </label>

        <div className="flex items-center gap-2">
          {/* Compact Clear Button */}
          <button
            type="button"
            onClick={() => onTextChange('')}
            disabled={!text}
            title="Clear text"
            className={`flex items-center gap-1.5 py-1 px-3 rounded-xl text-xs font-semibold transition-all border ${
              text
                ? 'bg-white text-slate-700 hover:bg-orange-50/50 hover:text-rose-600 hover:border-[#ff9b8f]/60 border-slate-200 cursor-pointer shadow-2xs'
                : 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
            }`}
          >
            <FaTrash className="text-xs" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* 2. Textarea filling available height with NO character cap */}
      <div className="relative flex-1 flex flex-col">
        <textarea
          value={text}
          onChange={(e) => {
            if (disabled) return;
            onTextChange(e.target.value);
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Type or paste your text here... The AI will convert it into natural-sounding speech."
          disabled={disabled}
          className={`w-full flex-1 min-h-[360px] sm:min-h-[400px] lg:min-h-[440px] p-4 border rounded-xl text-sm sm:text-base leading-relaxed resize-none overflow-auto transition-all duration-200 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 bg-white ${
            isFocused
              ? 'border-[#ff9b8f] ring-2 ring-[#ff9b8f]/25 shadow-xs'
              : 'border-slate-200/90'
          }`}
        />

        {!text && (
          <div className="absolute bottom-3 right-3 flex gap-2 pointer-events-none">
            <span className="text-[11px] text-gray-400 bg-gray-50 py-0.5 px-2 rounded-md border border-gray-200/60">
              Ctrl + V to paste
            </span>
          </div>
        )}
      </div>

      {/* 3. Bottom Meta: Word Count & Character Counter */}
      <div className="flex justify-between items-center px-1 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          {wordCount > 0 && (
            <span className="font-medium text-gray-600">
              {wordCount.toLocaleString()} {wordCount === 1 ? 'word' : 'words'}
            </span>
          )}
          {isLargeText && (
            <span
              className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/70"
              title="Large text input"
            >
              <FaExclamationTriangle className="text-[10px] text-amber-500" />
              Long text
            </span>
          )}
        </div>

        <span className="font-mono text-xs font-semibold flex items-center gap-1 px-2 py-0.5 rounded-md text-gray-600 bg-gray-50 border border-gray-200/70">
          <FaFont className="text-[10px]" />
          {charCount.toLocaleString()} chars
        </span>
      </div>
    </div>
  );
});

export default TextInput;
