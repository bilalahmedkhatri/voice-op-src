import { useState, memo } from 'react';
import { FaEdit, FaSave, FaTrash, FaFont, FaExclamationTriangle } from 'react-icons/fa';

interface TextInputProps {
  text: string;
  onTextChange: (text: string) => void;
  onSave: () => boolean;
  disabled?: boolean;
}

const TextInput = memo(function TextInput({ text, onTextChange, onSave, disabled = false }: TextInputProps) {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const charCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).filter(word => word.length > 0).length : 0;
  const maxChars = 5000;
  const recommendedLimit = 2500;
  const isLargeText = charCount > recommendedLimit;
  const isNearMax = charCount > maxChars * 0.9;

  const handleSave = () => {
    const success = onSave();
    if (success) {
      setToastMessage('Prompt saved successfully!');
    } else if (!text.trim()) {
      setToastMessage('Please enter some text first');
    } else {
      setToastMessage('This prompt is already saved');
    }
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="relative flex flex-col h-full justify-between gap-3">
      {/* 1. Header with Title & Compact Actions */}
      <div className="flex justify-between items-center flex-wrap gap-2">
        <label className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-800 uppercase tracking-wider">
          <FaEdit className="text-base text-[#ff9b8f]" />
          Enter Your Text
        </label>

        <div className="flex items-center gap-2">
          {/* Compact Save Button */}
          <button
            type="button"
            onClick={handleSave}
            disabled={!text.trim()}
            title="Save Prompt"
            className={`flex items-center gap-1.5 py-1 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              text.trim()
                ? 'bg-gradient-to-r from-[#ff9b8f] to-[#ffb4a8] hover:from-[#f8887a] hover:to-[#ffa79a] text-white shadow-2xs hover:shadow-xs'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200/60'
            }`}
          >
            <FaSave className="text-xs" />
            <span>Save</span>
          </button>

          {/* Compact Clear Button */}
          <button
            type="button"
            onClick={() => onTextChange('')}
            disabled={!text}
            title="Clear text"
            className={`flex items-center gap-1.5 py-1 px-3 rounded-lg text-xs font-medium transition-all border ${
              text
                ? 'bg-white text-gray-700 hover:bg-gray-50 hover:text-red-600 border-gray-200 cursor-pointer shadow-2xs'
                : 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
            }`}
          >
            <FaTrash className="text-xs" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* 2. Textarea filling available height */}
      <div className="relative flex-1 flex flex-col">
        <textarea
          value={text}
          onChange={(e) => {
            if (disabled) return;
            onTextChange(e.target.value);
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={
            disabled
              ? 'Generation limit reached. Please wait for reset...'
              : 'Type or paste your text here... The AI will convert it into natural-sounding speech.'
          }
          maxLength={maxChars}
          disabled={disabled}
          className={`w-full flex-1 min-h-[360px] sm:min-h-[400px] lg:min-h-[440px] p-4 border rounded-xl text-sm sm:text-base leading-relaxed resize-none overflow-auto transition-all duration-200 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 bg-white ${
            isFocused
              ? 'border-[#ff9b8f] ring-2 ring-[#ff9b8f]/20 shadow-xs'
              : 'border-gray-200/90'
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

      {/* 3. Bottom Meta: Word Count & Compact Character Counter */}
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
              title="Large text may take slightly longer to synthesize"
            >
              <FaExclamationTriangle className="text-[10px] text-amber-500" />
              Long text
            </span>
          )}
        </div>

        <span
          className={`font-mono text-xs font-semibold flex items-center gap-1 px-2 py-0.5 rounded-md ${
            isNearMax
              ? 'text-red-700 bg-red-50 border border-red-200'
              : isLargeText
              ? 'text-amber-700 bg-amber-50 border border-amber-200'
              : 'text-gray-600 bg-gray-50 border border-gray-200/70'
          }`}
        >
          <FaFont className="text-[10px]" />
          {charCount.toLocaleString()} / {maxChars.toLocaleString()}
        </span>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-6 right-6 bg-gray-900 text-white py-3 px-5 rounded-xl shadow-2xl z-50 flex items-center gap-3 text-sm font-medium animate-slideIn">
          {toastMessage}
        </div>
      )}
    </div>
  );
});

export default TextInput;
