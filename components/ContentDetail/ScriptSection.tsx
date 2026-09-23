import React, { useRef, useEffect } from 'react';
import { FiMic, FiCheck, FiCopy, FiSave, FiRefreshCw } from 'react-icons/fi';
import Card from '@/components/ui/Card';
import SectionHeader from '@/components/ui/SectionHeader';

interface ScriptSectionProps {
  item: any;
  itemType: "short" | "long_video" | null;
  setItem: (item: any) => void;
  handleSendToVoice: (text: string, type: "short" | "long_video" | null, title: string) => void;
  handleCopy: (text: string, id: string) => void;
  copiedId: string | null;
  handleSave: () => void;
  isSaving: boolean;
  saveSuccess: boolean;
}

export default function ScriptSection({
  item,
  itemType,
  setItem,
  handleSendToVoice,
  handleCopy,
  copiedId,
  handleSave,
  isSaving,
  saveSuccess
}: ScriptSectionProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoResize = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  useEffect(() => {
    autoResize();
    // Add event listener for window resize to adjust height
    window.addEventListener('resize', autoResize);
    return () => window.removeEventListener('resize', autoResize);
  }, [item.script]);

  return (
    <Card>
      <SectionHeader title="Full Script">
        {item.script && (
          <button
            onClick={() => handleSendToVoice(item.script, itemType, item.title)}
            className="flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            title="Send script to AI Voice Generator"
          >
            <FiMic className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Generate Voiceover</span>
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold shadow-sm transition-colors cursor-pointer ${
            saveSuccess 
              ? 'bg-green-100 text-green-700' 
              : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 disabled:opacity-50'
          }`}
        >
          {isSaving ? (
            <FiRefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : saveSuccess ? (
            <FiCheck className="w-3.5 h-3.5" />
          ) : (
            <FiSave className="w-3.5 h-3.5" />
          )}
          <span className="hidden sm:inline">{isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Changes'}</span>
        </button>
        <button onClick={() => handleCopy(item.script, 'script')} className="text-slate-400 hover:text-blue-600 transition-colors cursor-pointer p-1" title="Copy Script">
          {copiedId === 'script' ? <FiCheck className="w-4 h-4 text-green-500" /> : <FiCopy className="w-4 h-4" />}
        </button>
      </SectionHeader>
      {item.script ? (
        <textarea
          ref={textareaRef}
          value={item.script}
          onChange={(e) => {
            setItem({ ...item, script: e.target.value });
            autoResize();
          }}
          className="w-full text-slate-700 leading-relaxed text-sm bg-slate-50 border border-slate-200 rounded-lg p-3 sm:p-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none overflow-hidden"
          spellCheck="false"
          style={{ minHeight: '150px' }}
        />
      ) : (
        <p className="italic text-slate-400 text-sm">No script available</p>
      )}
    </Card>
  );
}
