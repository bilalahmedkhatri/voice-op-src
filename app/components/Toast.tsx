import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type?: 'error' | 'warning' | 'success' | 'info';
  onClose: () => void;
}

export default function Toast({ message, type = 'info', onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 10000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColors = {
    error: 'bg-red-100',
    warning: 'bg-yellow-100',
    success: 'bg-green-100',
    info: 'bg-blue-100',
  };

  const borderColors = {
    error: 'border-red-300',
    warning: 'border-yellow-300',
    success: 'border-green-300',
    info: 'border-blue-300',
  };

  const icons = {
    error: '❌',
    warning: '⚠️',
    success: '✅',
    info: 'ℹ️',
  };

  return (
    <div
      className={`fixed bottom-8 right-8 rounded-xl p-4 pr-6 shadow-lg max-w-md z-[9999] flex items-start gap-3 animate-slideInRight ${bgColors[type]} border-2 ${borderColors[type]}`}
      style={{ animation: 'slideInRight 0.3s ease-out, fadeOut 0.5s ease-out 9.5s forwards' }}
    >
      <span className="text-xl flex-shrink-0">
        {icons[type]}
      </span>
      <div className="flex-1">
        <p className="m-0 text-base text-gray-900 leading-normal whitespace-pre-wrap">
          {message}
        </p>
      </div>
      <button
        onClick={onClose}
        className="bg-transparent border-none cursor-pointer text-xl text-gray-500 p-0 leading-none flex-shrink-0"
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
}
