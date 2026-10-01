import { memo } from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';
import { designSystem as ds } from '../lib/designSystem';

interface GenerationStatusProps {
  errorMessage?: string | null;
  onDismissError?: () => void;
}

const GenerationStatus = memo(function GenerationStatus({
  errorMessage,
  onDismissError,
}: GenerationStatusProps) {
  if (!errorMessage) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 mt-4">
      <div
        role="alert"
        className="flex items-center justify-between p-3.5 px-4 bg-rose-50 text-rose-700 border border-rose-200/80 rounded-xl shadow-xs text-xs font-medium gap-3 flex-wrap"
      >
        <div className="flex items-center gap-2 flex-1">
          <FaExclamationTriangle className="text-rose-500 shrink-0 text-sm" />
          <span>{errorMessage}</span>
        </div>
        {onDismissError && (
          <button
            onClick={onDismissError}
            className="text-xs font-bold text-rose-600 hover:text-rose-800 underline cursor-pointer"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
});

export default GenerationStatus;
