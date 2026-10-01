"use client";

import React, { useState, useEffect } from "react";
import {
  FiCopy,
  FiCheck,
  FiTag,
  FiMessageSquare,
  FiLayers,
  FiShare2,
} from "react-icons/fi";

export interface CaptionItem {
  number?: number;
  caption: string;
  tags?: string[];
  [key: string]: any;
}

export interface CaptionsTemplateViewProps {
  captions: CaptionItem[];
  isEditing?: boolean;
  onDataChange?: (updatedCaptions: CaptionItem[]) => void;
}

interface CaptionCardProps {
  item: CaptionItem;
  index: number;
  isEditing: boolean;
  copiedId: string | null;
  onCopy: (text: string, id: string) => void;
  onItemChange: (index: number, field: string, value: any) => void;
}

const sanitizeText = (text: string) => text.replace(/—/g, "-");

const CaptionCard = ({
  item,
  index,
  isEditing,
  copiedId,
  onCopy,
  onItemChange,
}: CaptionCardProps) => {
  const capNumber = item.number ?? index + 1;
  const captionId = `caption-${index}`;
  const tagsId = `tags-${index}`;
  const fullPostId = `full-post-${index}`;

  const tagsArray = Array.isArray(item.tags)
    ? item.tags
    : typeof item.tags === "string"
    ? (item.tags as string).split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  const [tagsInput, setTagsInput] = useState(() => tagsArray.join(", "));

  useEffect(() => {
    setTagsInput(tagsArray.join(", "));
  }, [item.tags]);

  const formattedTagsString = tagsArray
    .map((t) => (t.startsWith("#") ? t : `#${t}`))
    .join(" ");

  const handleCopyFullPost = () => {
    const fullText = formattedTagsString
      ? `${item.caption}\n\n${formattedTagsString}`
      : item.caption;
    onCopy(fullText, fullPostId);
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-4">
      {/* Card Header */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold bg-slate-900 text-white">
            Caption #{capNumber}
          </span>
        </div>

        {/* Copy Full Post Action */}
        {!isEditing && (
          <button
            onClick={handleCopyFullPost}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#c83a2a] hover:bg-orange-100/80 bg-orange-50/70 border border-orange-200/80 px-2.5 py-1 rounded-xl transition-colors cursor-pointer"
            title="Copy Caption + Tags"
          >
            {copiedId === fullPostId ? (
              <>
                <FiCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-600">Copied All</span>
              </>
            ) : (
              <>
                <FiShare2 className="w-3.5 h-3.5" />
                <span>Copy Post</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Caption Content */}
      <div className="space-y-1.5 flex-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
            <FiMessageSquare className="w-3 h-3 text-slate-400" /> Caption
          </span>
          {!isEditing && item.caption && (
            <button
              onClick={() => onCopy(item.caption, captionId)}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-[#c83a2a] font-medium px-2 py-0.5 rounded hover:bg-slate-100 transition-colors cursor-pointer"
              title="Copy Caption Only"
            >
              {copiedId === captionId ? (
                <>
                  <FiCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600">Copied</span>
                </>
              ) : (
                <>
                  <FiCopy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          )}
        </div>

        {isEditing ? (
          <textarea
            rows={4}
            value={item.caption || ""}
            onChange={(e) => onItemChange(index, "caption", e.target.value)}
            placeholder="Enter caption text..."
            className="w-full p-2.5 bg-white rounded-xl border border-slate-300 text-sm text-slate-800 leading-relaxed shadow-xs focus:outline-none focus:ring-2 focus:ring-[#ff9b8f]/25 focus:border-[#ff9b8f] resize-y"
          />
        ) : item.caption ? (
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap selection:bg-orange-100">
            {sanitizeText(item.caption)}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">No caption text provided.</p>
        )}
      </div>

      {/* Hashtags Section */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
            <FiTag className="w-3 h-3 text-slate-400" /> Hashtags
            {tagsArray.length > 0 && (
              <span className="text-slate-400 font-normal">({tagsArray.length})</span>
            )}
          </span>
          {!isEditing && tagsArray.length > 0 && (
            <button
              onClick={() => onCopy(formattedTagsString, tagsId)}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-[#c83a2a] font-medium px-2 py-0.5 rounded hover:bg-slate-100 transition-colors cursor-pointer"
              title="Copy All Tags (Space separated)"
            >
              {copiedId === tagsId ? (
                <>
                  <FiCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600">Copied</span>
                </>
              ) : (
                <>
                  <FiCopy className="w-3.5 h-3.5" />
                  <span>Copy Tags</span>
                </>
              )}
            </button>
          )}
        </div>

        {isEditing ? (
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => {
              const val = e.target.value;
              setTagsInput(val);
              const arr = val
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean);
              onItemChange(index, "tags", arr);
            }}
            placeholder="#KarachiFashion, #Summer (comma-separated)"
            className="w-full p-2.5 bg-white rounded-xl border border-slate-300 text-xs font-medium text-slate-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-[#ff9b8f]/25 focus:border-[#ff9b8f]"
          />
        ) : tagsArray.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {tagsArray.map((tag, tIdx) => {
              const formatted = tag.trim().startsWith("#")
                ? tag.trim()
                : `#${tag.trim()}`;
              return (
                <span
                  key={tIdx}
                  className="inline-flex items-center px-2.5 py-0.5 bg-orange-50 text-orange-900 border border-orange-200/80 rounded-full text-xs font-medium"
                >
                  {formatted}
                </span>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">No hashtags provided.</p>
        )}
      </div>
    </div>
  );
};

export default function CaptionsTemplateView({
  captions,
  isEditing = false,
  onDataChange,
}: CaptionsTemplateViewProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    if (!onDataChange) return;
    const updated = captions.map((item, idx) => {
      if (idx !== index) return item;
      return { ...item, [field]: value };
    });
    onDataChange(updated);
  };

  if (!Array.isArray(captions) || captions.length === 0) {
    return (
      <div className="p-8 text-center bg-white border border-slate-200/80 rounded-2xl text-slate-500">
        No captions available.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Summary Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#ff7d6e] shrink-0">
            <FiLayers className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Social Media Content
            </span>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
              Ready-to-Use Captions
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1.5 bg-orange-50 text-[#c83a2a] rounded-full text-xs font-semibold border border-orange-200/80 flex items-center gap-1.5">
            {captions.length} {captions.length === 1 ? "Caption" : "Captions"}
          </span>
        </div>
      </div>

      {/* Two-Column Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {captions.map((item, index) => (
          <CaptionCard
            key={item.number ?? index}
            item={item}
            index={index}
            isEditing={isEditing}
            copiedId={copiedId}
            onCopy={handleCopy}
            onItemChange={handleItemChange}
          />
        ))}
      </div>
    </div>
  );
}
