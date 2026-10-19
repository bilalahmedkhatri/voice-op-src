
import {errorCopy} from '@/i18n/errors';

import {useCopy} from '@/i18n/copy';
import { memo, type ReactNode } from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';
import Button from '@/components/ui/Button';

interface GenerationStatusProps {
  errorMessage?: string | null;
  onDismissError?: () => void;
  progress?: { completed: number; total: number } | null;
  isGenerating?: boolean;
  onResume?: () => void;
  retryAvailable?: boolean;
  children?: ReactNode;
}

const GenerationStatus = memo(function GenerationStatus({
  errorMessage,
  onDismissError, progress, isGenerating, onResume, retryAvailable, children,
}: GenerationStatusProps) {
  const copy = useCopy();


  if (!errorMessage && !progress && !onResume && !isGenerating) {
    return null;
  }

  return (
    <div className="space-y-3 rounded-xl bg-slate-50/70 p-3.5" aria-label={copy("Audio generation status")}>
      {(progress || onResume || isGenerating) && (
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600" role="status" aria-live="polite">
          {progress && progress.total > 0 && <>
            <span>{progress.completed} {copy(" of ")}{progress.total} {copy(" audio parts ready")}</span>
            <div role="progressbar" aria-label={copy("Voiceover progress")} aria-valuenow={progress.completed}
              aria-valuemin={0} aria-valuemax={progress.total} className="h-1.5 w-full sm:w-40 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full bg-[#ff7d6e]" style={{ width: `${progress.completed / progress.total * 100}%` }} />
            </div>
          </>}
          {onResume && !isGenerating && <Button size="sm" onClick={onResume}>
            {retryAvailable ? copy("Retry unfinished audio") : copy("Check progress")}
          </Button>}
          {isGenerating && <span className="text-xs text-slate-500">
            {progress && progress.total > 0 && progress.completed >= progress.total ? copy("Finalizing your audio...") : copy("Generating your audio...")}
          </span>}
        </div>
      )}
      {children}
      {errorMessage && <div
        role="alert"
        className="flex items-center justify-between p-3.5 px-4 bg-rose-50 text-rose-700 border border-rose-200/80 rounded-xl shadow-xs text-xs font-medium gap-3 flex-wrap"
      >
        <div className="flex items-center gap-2 flex-1">
          <FaExclamationTriangle className="text-rose-500 shrink-0 text-sm" />
          <span>{errorCopy(errorMessage, copy)}</span>
        </div>
        {onDismissError && (
          <button
            onClick={onDismissError}
            className="text-xs font-bold text-rose-600 hover:text-rose-800 underline cursor-pointer"
          >
            {copy("Dismiss")}</button>
        )}
      </div>}
    </div>
  );
});

export default GenerationStatus;
