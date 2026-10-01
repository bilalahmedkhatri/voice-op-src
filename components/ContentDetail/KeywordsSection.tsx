import React from 'react';
import { FiCheck, FiCopy, FiSearch } from 'react-icons/fi';
import Card from '@/components/ui/Card';
import SectionHeader from '@/components/ui/SectionHeader';
import { Button, IconButton } from '@/components/ui';

interface KeywordsSectionProps {
  keywordsList: { keyword: string; quantity_to_download?: number }[];
  copiedId: string | null;
  handleCopy: (text: string, id: string) => void;
  rawKeywordsData: any;
  handleFetchByKeywords: (keywords: any) => void;
  isDownloading: boolean;
}

export default function KeywordsSection({
  keywordsList,
  copiedId,
  handleCopy,
  rawKeywordsData,
  handleFetchByKeywords,
  isDownloading
}: KeywordsSectionProps) {
  return (
    <Card>
      <SectionHeader title="Search Keywords">
        <IconButton
          icon={copiedId === 'keywords' ? <FiCheck className="w-4 h-4 text-emerald-500" /> : <FiCopy className="w-4 h-4" />}
          title="Copy Keywords"
          size="xs"
          variant="ghost"
          onClick={() => handleCopy(rawKeywordsData, 'keywords')}
        />
      </SectionHeader>
      {keywordsList.length > 0 ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {keywordsList.map((k, i: number) => (
              <span key={i} className="inline-flex items-center gap-1.5 bg-orange-50/80 border border-orange-200/80 text-orange-950 px-3 py-1.5 rounded-full text-xs font-medium shadow-xs break-all">
                {k.keyword}
                {k.quantity_to_download && (
                  <span className="bg-orange-200/70 text-orange-950 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                    {k.quantity_to_download}
                  </span>
                )}
              </span>
            ))}
          </div>
          <div className="pt-2 border-t border-slate-100 flex justify-end">
            <Button
              size="md"
              variant="primary"
              onClick={() => handleFetchByKeywords(keywordsList)}
              disabled={isDownloading}
              isLoading={isDownloading}
              icon={<FiSearch />}
              title="Generate media from keywords"
              className="w-full sm:w-auto"
            >
              Generate Content
            </Button>
          </div>
        </div>
      ) : (
        <p className="italic text-slate-400 text-sm">No search keywords provided</p>
      )}
    </Card>
  );
}
