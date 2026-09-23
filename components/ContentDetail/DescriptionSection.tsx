import React from 'react';
import { FiMic, FiCheck, FiCopy } from 'react-icons/fi';
import Card from '@/components/ui/Card';
import SectionHeader from '@/components/ui/SectionHeader';

interface DescriptionSectionProps {
  item: any;
  itemType: "short" | "long_video" | null;
  handleSendToVoice: (text: string, type: "short" | "long_video" | null, title: string) => void;
  copiedId: string | null;
  handleCopy: (text: string, id: string) => void;
}

export default function DescriptionSection({ item, itemType, handleSendToVoice, copiedId, handleCopy }: DescriptionSectionProps) {
  return (
    <Card>
      <SectionHeader title="Description">
        {item.description && !item.script && (
          <button
            onClick={() => handleSendToVoice(item.description, itemType, item.title)}
            className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-xs font-semibold transition-colors cursor-pointer"
            title="Send description to Voice Generator"
          >
            <FiMic className="w-3.5 h-3.5" />
            <span>Voice</span>
          </button>
        )}
        <button onClick={() => handleCopy(item.description, 'desc')} className="text-slate-400 hover:text-blue-600 transition-colors cursor-pointer p-1" title="Copy Description">
          {copiedId === 'desc' ? <FiCheck className="w-4 h-4 text-green-500" /> : <FiCopy className="w-4 h-4" />}
        </button>
      </SectionHeader>
      <p className="text-slate-700 whitespace-pre-wrap leading-relaxed text-sm">
        {item.description || <span className="italic text-slate-400">No description provided</span>}
      </p>
    </Card>
  );
}
