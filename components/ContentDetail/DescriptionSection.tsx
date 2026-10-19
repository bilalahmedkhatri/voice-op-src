
import {useCopy} from '@/i18n/copy';
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
  const copy = useCopy();


  return (
    <Card>
      <SectionHeader title={copy("Description")}>
        {item.description && !item.script && (
          <Button
            onClick={() => handleSendToVoice(item.description, itemType, item.title)}
            variant="primary"
            size="xs"
            icon={<FiMic className="w-3.5 h-3.5" />}
            title={copy("Send description to Voice Generator")}
          >
            {copy("Voice")}</Button>
        )}
        <IconButton
          icon={copiedId === 'desc' ? <FiCheck className="w-4 h-4 text-emerald-500" /> : <FiCopy className="w-4 h-4" />}
          title={copy("Copy Description")}
          variant="ghost"
          size="xs"
          onClick={() => handleCopy(item.description, 'desc')}
        />
      </SectionHeader>
      <p className="text-slate-700 whitespace-pre-wrap leading-relaxed text-sm">
        {item.description || <span className="italic text-slate-400">{copy("No description provided")}</span>}
      </p>
    </Card>
  );
}
