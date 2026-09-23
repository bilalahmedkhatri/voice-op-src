import React from 'react';
import { FiCheck, FiCopy } from 'react-icons/fi';
import Card from '@/components/ui/Card';
import SectionHeader from '@/components/ui/SectionHeader';

interface TagsSectionProps {
  tagsList: string[];
  copiedId: string | null;
  handleCopy: (text: string, id: string) => void;
  rawTagsData: any;
}

export default function TagsSection({ tagsList, copiedId, handleCopy, rawTagsData }: TagsSectionProps) {
  return (
    <Card>
      <SectionHeader title="Tags">
        <button onClick={() => handleCopy(rawTagsData, 'tags')} className="text-slate-400 hover:text-blue-600 transition-colors cursor-pointer p-1" title="Copy Tags">
          {copiedId === 'tags' ? <FiCheck className="w-4 h-4 text-green-500" /> : <FiCopy className="w-4 h-4" />}
        </button>
      </SectionHeader>
      {tagsList.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {tagsList.map((t: string, i: number) => (
            <span key={i} className="inline-block bg-slate-100 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-full text-xs font-medium shadow-sm">
              {t}
            </span>
          ))}
        </div>
      ) : (
        <p className="italic text-slate-400 text-sm">No tags provided</p>
      )}
    </Card>
  );
}
