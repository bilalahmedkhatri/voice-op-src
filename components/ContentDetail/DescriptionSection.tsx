import React from 'react';
import { FiMic, FiCheck, FiCopy } from 'react-icons/fi';
import Card from '@/components/ui/Card';
import SectionHeader from '@/components/ui/SectionHeader';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';

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
          <Button
            onClick={() => handleSendToVoice(item.description, itemType, item.title)}
            variant="primary"
            size="xs"
            icon={<FiMic className="w-3.5 h-3.5" />}
            title="Send description to Voice Generator"
          >
            Voice
          </Button>
        )}
        <IconButton
          icon={copiedId === 'desc' ? <FiCheck className="w-4 h-4 text-emerald-500" /> : <FiCopy className="w-4 h-4" />}
          title="Copy Description"
          variant="ghost"
          size="xs"
          onClick={() => handleCopy(item.description, 'desc')}
        />
      </SectionHeader>
      <p className="text-slate-700 whitespace-pre-wrap leading-relaxed text-sm">
        {item.description || <span className="italic text-slate-400">No description provided</span>}
      </p>
    </Card>
  );
}
