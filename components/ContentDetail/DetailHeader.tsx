import React from 'react';
import Link from 'next/link';
import { FiArrowLeft, FiYoutube, FiVideo, FiMic, FiCheck, FiCopy } from 'react-icons/fi';

interface DetailHeaderProps {
  templateId: string | null;
  itemType: "short" | "long_video" | null;
  item: any;
  handleSendToVoice: (text: string, type: "short" | "long_video" | null, title: string) => void;
  copiedId: string | null;
  handleCopy: (text: string, id: string) => void;
}

export default function DetailHeader({
  templateId,
  itemType,
  item,
  handleSendToVoice,
  copiedId,
  handleCopy
}: DetailHeaderProps) {
  return (
    <>
      <div className="flex flex-col space-y-3 sm:space-y-2">
        <Link href={`/content?id=${templateId}`} className="hidden sm:inline-flex items-center gap-2 text-sm text-blue-600 hover:underline font-medium w-fit">
          <FiArrowLeft /> Back to Content Table
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-row items-center gap-2">
            {itemType === "long_video" ? (
              <span className="inline-flex items-center justify-center p-1.5 sm:px-3 sm:py-1.5 bg-purple-100 text-purple-800 border border-purple-200 rounded-lg text-sm font-bold shadow-sm" title="Long Video">
                <FiYoutube className="w-4 h-4" /> 
                <span className="hidden sm:inline ml-1.5">Long Video</span>
              </span>
            ) : (
              <span className="inline-flex items-center justify-center p-1.5 sm:px-3 sm:py-1.5 bg-red-100 text-red-800 border border-red-200 rounded-lg text-sm font-bold shadow-sm" title="Short Video">
                <FiVideo className="w-4 h-4" /> 
                <span className="hidden sm:inline ml-1.5">Short Video</span>
              </span>
            )}
            <h1 className="text-lg sm:text-2xl font-bold text-slate-900 line-clamp-2 sm:line-clamp-1 flex-1">
              {item.title || "Untitled Video"}
            </h1>
          </div>
        </div>
      </div>
    </>
  );
}
