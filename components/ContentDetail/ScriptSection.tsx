import React, { useRef, useEffect } from 'react';
import { FiMic, FiCheck, FiCopy, FiSave, FiRefreshCw } from 'react-icons/fi';
import Card from '@/components/ui/Card';
import SectionHeader from '@/components/ui/SectionHeader';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';

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
          <Button
            onClick={() => handleSendToVoice(item.script, itemType, item.title)}
            variant="primary"
            size="sm"
            icon={<FiMic className="w-3.5 h-3.5" />}
            title="Send script to AI Voice Generator"
          >
            <span className="hidden sm:inline">Generate Voiceover</span>
          </Button>
        )}
        <Button
          onClick={handleSave}
          disabled={isSaving}
          isLoading={isSaving}
          variant="soft"
          size="sm"
          icon={saveSuccess ? <FiCheck className="w-3.5 h-3.5" /> : <FiSave className="w-3.5 h-3.5" />}
          className={saveSuccess ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : ''}
        >
          <span className="hidden sm:inline">{isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Changes'}</span>
        </Button>
        <IconButton
          icon={copiedId === 'script' ? <FiCheck className="w-4 h-4 text-emerald-500" /> : <FiCopy className="w-4 h-4" />}
          title="Copy Script"
          variant="ghost"
          size="xs"
          onClick={() => handleCopy(item.script, 'script')}
        />
      </SectionHeader>
      {item.script ? (
        <textarea
          ref={textareaRef}
          value={item.script}
          onChange={(e) => {
            setItem({ ...item, script: e.target.value });
            autoResize();
          }}
          className="w-full text-slate-700 leading-relaxed text-sm bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4 focus:ring-2 focus:ring-[#ff9b8f]/25 focus:border-[#ff9b8f] outline-none resize-none overflow-hidden"
          spellCheck="false"
          style={{ minHeight: '150px' }}
        />
      ) : (
        <p className="italic text-slate-400 text-sm">No script available</p>
      )}
    </Card>
  );
}
