import React from 'react';
import { FiCheck, FiCopy, FiSearch, FiRefreshCw } from 'react-icons/fi';
import Card from '@/components/ui/Card';
import SectionHeader from '@/components/ui/SectionHeader';

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
        <button onClick={() => handleCopy(rawKeywordsData, 'keywords')} className="text-slate-400 hover:text-blue-600 transition-colors cursor-pointer p-1" title="Copy Keywords">
          {copiedId === 'keywords' ? <FiCheck className="w-4 h-4 text-green-500" /> : <FiCopy className="w-4 h-4" />}
        </button>
      </SectionHeader>
      {keywordsList.length > 0 ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {keywordsList.map((k, i: number) => (
              <span key={i} className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1.5 rounded-full text-xs font-medium shadow-sm break-all">
                {k.keyword}
                {k.quantity_to_download && (
                  <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                    {k.quantity_to_download}
                  </span>
                )}
              </span>
            ))}
          </div>
          <div className="pt-2 border-t border-slate-100 flex justify-end">
            <button
              onClick={() => handleFetchByKeywords(keywordsList)}
              disabled={isDownloading}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-slate-400 disabled:to-slate-400 text-white rounded-lg text-sm font-semibold shadow-sm hover:shadow transition-all cursor-pointer w-full sm:w-auto justify-center"
              title="Generate media from keywords"
            >
              {isDownloading ? (
                <FiRefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <FiSearch className="w-4 h-4" />
              )}
              <span>Generate Content</span>
            </button>
          </div>
        </div>
      ) : (
        <p className="italic text-slate-400 text-sm">No search keywords provided</p>
      )}
    </Card>
  );
}
