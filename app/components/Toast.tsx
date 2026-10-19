
import {useCopy} from '@/i18n/copy';
import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type?: 'error' | 'warning' | 'success' | 'info';
  onClose: () => void;
}

export default function Toast({ message, type = 'info', onClose }: ToastProps) {
  const copy = useCopy();


  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 10000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColors = {
    error: 'bg-rose-50',
    warning: 'bg-amber-50',
    success: 'bg-emerald-50',
    info: 'bg-orange-50',
  };

  const borderColors = {
    error: 'border-rose-200',
    warning: 'border-amber-200',
    success: 'border-emerald-200',
    info: 'border-orange-200',
  };

  const icons = {
    error: '❌',
    warning: '⚠️',
    success: '✅',
    info: '💡',
  };

  return (
    <div
      className={`fixed bottom-8 right-8 rounded-2xl p-4 pr-6 shadow-lg max-w-md z-[9999] flex items-start gap-3 animate-slideInRight ${bgColors[type]} border ${borderColors[type]}`}
      style={{ animation: 'slideInRight 0.3s ease-out, fadeOut 0.5s ease-out 9.5s forwards' }}
    >
      <span className="text-xl flex-shrink-0">
        {icons[type]}
      </span>
      <div className="flex-1">
        <p className="m-0 text-base text-gray-900 leading-normal whitespace-pre-wrap">
          {copy(message)}
        </p>
      </div>
      <button
        onClick={onClose}
        className="bg-transparent border-none cursor-pointer text-xl text-gray-500 p-0 leading-none flex-shrink-0"
        aria-label={copy("Close notification")}
      >
        ×
      </button>
    </div>
  );
}
