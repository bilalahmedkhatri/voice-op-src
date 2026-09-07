import { useState, useEffect } from 'react';
import { designSystem as ds } from '../lib/designSystem';
import Toast from './Toast';

interface ApiToggleProps {
  onToggle?: (useReplicate: boolean) => void;
}

export default function ApiToggle({ onToggle }: ApiToggleProps) {
  const [useReplicate, setUseReplicate] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'warning' | 'success' | 'info' } | null>(null);

  useEffect(() => {
    // Fetch current config
    fetch('/api/voiceover/config')
      .then(res => res.json())
      .then(data => {
        setUseReplicate(data.useReplicate);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, []);

  const handleToggle = async () => {
    setIsSwitching(true);
    try {
      const newUseReplicate = !useReplicate;
      
      const response = await fetch('/api/voiceover/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ useReplicate: newUseReplicate }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setUseReplicate(data.useReplicate);
        
        // Check if switching to Default API (useReplicate = false)
        if (!data.useReplicate) {
          // Try to fetch voices to verify API is working
          try {
            const voicesResponse = await fetch('/api/voiceover/voiceover_samples');
            if (!voicesResponse.ok) {
              let errorMsg = 'Please make sure your backend API is running at http://localhost:8000';
              try {
                const error = await voicesResponse.json();
                errorMsg = error.error || errorMsg;
              } catch {
                // Response is not JSON, use default message
              }
              setToast({
                message: `Failed to connect to the default API server.\n\n${errorMsg}`,
                type: 'warning'
              });
            }
          } catch (err) {
            setToast({
              message: 'Failed to connect to the default API server. Please make sure your backend API is running at http://localhost:8000',
              type: 'warning'
            });
          }
        }
        
        // Notify parent component to refresh affected areas
        if (onToggle) {
          onToggle(data.useReplicate);
        }
      }
    } catch (error) {
      // console.error('Failed to toggle API mode:', error);
      setToast({
        message: 'Failed to toggle API mode. Please try again.',
        type: 'error'
      });
    } finally {
      setIsSwitching(false);
    }
  };

  if (isLoading) return null;

  return (
    <div className={`flex items-center gap-2 ${isSwitching ? 'cursor-not-allowed opacity-60' : ''}`}>
      <span className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">
        {useReplicate ? 'Replicate' : 'Default'}
      </span>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={useReplicate}
          onChange={handleToggle}
          disabled={isSwitching}
          className="sr-only peer"
          aria-label={`Switch to ${useReplicate ? 'Default API' : 'Replicate'}`}
        />
        <div className="w-10 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:bg-indigo-400 peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all after:shadow-sm"></div>
      </label>
      
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
