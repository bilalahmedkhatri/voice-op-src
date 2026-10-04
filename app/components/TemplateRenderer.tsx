"use client";

import React, { useState, useEffect } from "react";
import {
  FiCopy,
  FiEdit2,
  FiCheck,
  FiSave,
  FiExternalLink,
  FiClock,
  FiImage,
  FiVideo,
  FiTag,
  FiLayers,
  FiCalendar,
  FiMic
} from "react-icons/fi";
import CaptionsTemplateView from "./CaptionsTemplateView";
import IconButton from "@/components/ui/IconButton";

interface TemplateRendererProps {
  data: any;
  level?: number;
  isEditing?: boolean;
  onDataChange?: (newData: any) => void;
}

const sanitizeText = (text: string) => text.replace(/—/g, "-");

const checkIsUrl = (str: string) => {
  try {
    new URL(str);
    return str.startsWith("http");
  } catch (_) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
  }
};

const getHref = (str: string) => {
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str) && !str.startsWith("mailto:")) {
    return `mailto:${str}`;
  }
  return str;
};

const PromptTextarea = ({ initialValue }: { initialValue: string }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(sanitizeText(initialValue));
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  const handleSendToVoiceStudio = () => {
    if (!value.trim()) return;
    if (typeof window !== "undefined") {
      localStorage.setItem("pending_voice_script", value);
      window.location.href = "/admin?from=json";
    }
  };

  return (
    <div className="relative group">
      <div className="absolute top-2 right-2 flex gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <IconButton
          onClick={handleSendToVoiceStudio}
          title="Send to Voice Studio"
          icon={<FiMic className="w-4 h-4 text-[#ff7d6e]" />}
          variant="secondary"
          size="md"
        />
        {isEditing ? (
          <IconButton
            onClick={() => setIsEditing(false)}
            title="Save changes"
            icon={<FiSave className="w-4 h-4" />}
            variant="primary"
            size="md"
          />
        ) : (
          <IconButton
            onClick={() => setIsEditing(true)}
            title="Edit text"
            icon={<FiEdit2 className="w-4 h-4" />}
            variant="secondary"
            size="md"
          />
        )}
        <IconButton
          onClick={handleCopy}
          title="Copy text"
          icon={copied ? <FiCheck className="w-4 h-4 text-emerald-500" /> : <FiCopy className="w-4 h-4" />}
          variant="secondary"
          size="md"
        />
      </div>

      <textarea
        readOnly={!isEditing}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className={`w-full min-h-[350px] p-3.5 pt-10 bg-white border border-slate-200/80 rounded-xl shadow-xs focus:outline-none focus:ring-2 focus:ring-[#ff9b8f]/25 focus:border-[#ff9b8f] text-sm overflow-y-auto resize-none text-slate-800 transition-all ${isEditing ? "ring-2 ring-[#ff9b8f]/30 border-[#ff9b8f]" : ""
          }`}
      />
    </div>
  );
};

const EditableListItem = ({ initialValue, isUrl = false }: { initialValue: string, isUrl?: boolean }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(sanitizeText(initialValue));
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) { }
  };

  return (
    <li className="flex items-center gap-2 group hover:bg-slate-50 transition-colors rounded-lg w-max min-w-full pr-4 py-1">
      {isEditing ? (
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="flex-1 text-sm px-2 py-1 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff9b8f]/25 focus:border-[#ff9b8f] w-full"
        />
      ) : isUrl ? (
        <a href={getHref(value)} target={getHref(value).startsWith("mailto:") ? undefined : "_blank"} rel="noopener noreferrer" className="flex-1 text-sm text-[#c83a2a] hover:underline flex items-center gap-1 whitespace-nowrap font-medium">
          {value} <FiExternalLink className="w-3 h-3 shrink-0 opacity-50" />
        </a>
      ) : (
        <span className="flex-1 text-sm text-slate-700 whitespace-nowrap">{value}</span>
      )}

      <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {isEditing ? (
          <IconButton onClick={() => setIsEditing(false)} title="Save" variant="primary" size="xs" icon={<FiSave className="w-3.5 h-3.5" />} />
        ) : (
          <IconButton onClick={() => setIsEditing(true)} title="Edit" variant="ghost" size="xs" icon={<FiEdit2 className="w-3.5 h-3.5" />} />
        )}
        <IconButton onClick={handleCopy} title="Copy" variant="ghost" size="xs" icon={copied ? <FiCheck className="w-3.5 h-3.5 text-emerald-500" /> : <FiCopy className="w-3.5 h-3.5" />} />
      </div>
    </li>
  );
}

const TagsEditor = ({ initialTags }: { initialTags: string[] }) => {
  const formattedTags = initialTags.map(t => {
    let tag = t.trim();
    if (tag && !tag.startsWith("#")) tag = "#" + tag;
    return tag;
  });

  const [isEditing, setIsEditing] = useState(false);
  const [textValue, setTextValue] = useState(formattedTags.join(", "));
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) { }
  };

  const currentTags = textValue.split(",").map(t => t.trim()).filter(Boolean);

  return (
    <div className="p-4 bg-white border border-slate-200/80 shadow-xs rounded-xl relative group">
      <div className="absolute top-2 right-2 flex gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        {isEditing ? (
          <IconButton onClick={() => setIsEditing(false)} title="Save" variant="primary" size="sm" icon={<FiSave className="w-4 h-4" />} />
        ) : (
          <IconButton onClick={() => setIsEditing(true)} title="Edit" variant="secondary" size="sm" icon={<FiEdit2 className="w-4 h-4" />} />
        )}
        <IconButton onClick={handleCopy} title="Copy" variant="secondary" size="sm" icon={copied ? <FiCheck className="w-4 h-4 text-emerald-500" /> : <FiCopy className="w-4 h-4" />} />
      </div>

      {isEditing ? (
        <textarea
          value={textValue}
          onChange={(e) => setTextValue(e.target.value)}
          className="w-full min-h-[100px] mt-6 p-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ff9b8f]/25 focus:border-[#ff9b8f]"
        />
      ) : (
        <div className="flex flex-wrap gap-2 mt-2">
          {currentTags.map((tag, i) => (
            <span key={i} className="px-3 py-1 bg-orange-50 text-orange-900 text-xs font-semibold rounded-full border border-orange-200/80">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

const SceneTable = ({ items }: { items: any[] }) => {
  if (!items.length) return null;
  const keys = Array.from(new Set(items.flatMap(item => Object.keys(item))));

  const getColClass = (keyName: string) => {
    const k = keyName.toLowerCase();
    if (k.includes("id")) {
      return "min-w-[150px] max-w-[200px] whitespace-normal break-all px-6";
    }
    if (k.includes("prompt") || k.includes("description") || k.includes("script")) {
      return "min-w-[280px] max-w-[400px] whitespace-normal px-6";
    }
    if (k.includes("title") || k.includes("topic") || k.includes("name")) {
      return "min-w-[200px] max-w-[300px] whitespace-normal px-6";
    }
    if (k.includes("tag")) {
      return "min-w-[150px] max-w-[250px] whitespace-normal px-6";
    }
    if (k.includes("link") || k.includes("url") || k.includes("resource")) {
      return "min-w-[200px] max-w-[300px] whitespace-normal px-6";
    }
    return "w-auto whitespace-nowrap px-6";
  };

  const renderTableCell = (value: any, keyName: string) => {
    if (value === undefined || value === null) return "-";

    // Prevent [object Object] for array of objects (like posts in a table)
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
      return (
        <div className="flex flex-col gap-2 py-1 min-w-[260px] max-w-sm">
          {value.map((item: any, idx: number) => (
            <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
              <div className="flex items-center justify-between font-semibold text-slate-800">
                <span>{item.post_number ? `Post #${item.post_number}` : `Item #${idx + 1}`} {item.time ? `• ${item.time}` : ''}</span>
                {item.format && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${item.format.toLowerCase() === 'video'
                    ? 'bg-orange-50 text-orange-800 border border-orange-200/80'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}>
                    {item.format}
                  </span>
                )}
              </div>
              {item.caption && <p className="text-slate-600 line-clamp-2 leading-relaxed">{sanitizeText(item.caption)}</p>}
              {item.generation_prompt && (
                <p className="text-slate-500 font-mono text-[10px] line-clamp-2 bg-white p-1 rounded border border-slate-200">
                  {sanitizeText(item.generation_prompt)}
                </p>
              )}
            </div>
          ))}
        </div>
      );
    }

    // Prevent [object Object] for a single object
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      return (
        <div className="text-xs text-slate-700 bg-slate-50 p-2 rounded border border-slate-200 space-y-1">
          {Object.entries(value).slice(0, 3).map(([k, v]) => (
            <div key={k} className="flex gap-1.5">
              <span className="font-semibold text-slate-500 uppercase text-[10px]">{k}:</span>
              <span className="truncate">{String(v)}</span>
            </div>
          ))}
        </div>
      );
    }

    const isTagArray = keyName.toLowerCase().includes('tag');
    const isLinkArray = keyName.toLowerCase().includes('link') || keyName.toLowerCase().includes('url');

    let itemsToRender: string[] = [];
    if (Array.isArray(value)) {
      itemsToRender = value.map(v => String(v));
    } else if (typeof value === 'string' && value.includes(',') && (isTagArray || isLinkArray || value.includes('http'))) {
      itemsToRender = value.split(',').map(s => s.trim());
    } else {
      itemsToRender = [String(value)];
    }

    if (isTagArray && itemsToRender.length > 0) {
      const displayTags = itemsToRender.slice(0, 5);
      const hasMore = itemsToRender.length > 5;
      return (
        <ul className="flex flex-wrap gap-1.5 list-none p-0 m-0">
          {displayTags.map((tag, idx) => {
            const formatted = tag.trim().startsWith('#') ? tag.trim() : `#${tag.trim()}`;
            return (
              <li key={idx} className="px-2 py-0.5 bg-orange-50 text-orange-900 text-[11px] font-semibold rounded-full border border-orange-200/80 whitespace-nowrap">
                {formatted}
              </li>
            );
          })}
          {hasMore && (
            <li className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[11px] font-semibold rounded-full border border-slate-200 whitespace-nowrap">
              +{itemsToRender.length - 5}
            </li>
          )}
        </ul>
      );
    }

    if (itemsToRender.length > 1 || (itemsToRender.length === 1 && checkIsUrl(itemsToRender[0]))) {
      const displayItems = itemsToRender.slice(0, 3);
      const hasMore = itemsToRender.length > 3;
      return (
        <ul className="flex flex-col p-0 m-0 list-none space-y-1">
          {displayItems.map((v, idx) => {
            const sanitized = sanitizeText(v);
            if (checkIsUrl(sanitized)) {
              return (
                <li key={idx} className="p-0 m-0 leading-[1.2]">
                  <a href={getHref(sanitized)} target={getHref(sanitized).startsWith("mailto:") ? undefined : "_blank"} rel="noopener noreferrer" className="text-[#c83a2a] hover:underline flex items-center gap-1 whitespace-nowrap font-medium max-w-[280px] overflow-hidden text-ellipsis">
                    <span className="flex-1 truncate">{sanitized}</span>
                    <FiExternalLink className="w-3 h-3 flex-shrink-0 opacity-50" />
                  </a>
                </li>
              );
            }
            return <li key={idx} className="p-0 m-0 leading-[1.2] line-clamp-2">{sanitized}</li>;
          })}
          {hasMore && (
            <li className="text-xs text-slate-500 italic mt-1 font-medium">+{itemsToRender.length - 3} more items</li>
          )}
        </ul>
      );
    }

    return <div className="line-clamp-3 text-sm leading-relaxed text-slate-600">{sanitizeText(String(value))}</div>;
  };

  return (
    <div className="w-full border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-xs">
      <div className="overflow-x-auto overflow-y-auto max-h-[500px]">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-600 uppercase bg-slate-50 sticky top-0 z-10 shadow-sm">
            <tr>
              {keys.map(k => (
                <th key={k} className={`py-3 font-semibold tracking-wide ${getColClass(k)}`}>
                  {k.replace(/_/g, " ")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {items.map((item, i) => (
              <tr key={i} className="hover:bg-slate-50/50">
                {keys.map(k => (
                  <td key={k} className={`py-4 align-top ${getColClass(k)} text-slate-700`}>
                    {renderTableCell(item[k], k)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Specialized, modern renderer for Social Media / Calendar Content Plans
interface ContentPlanPost {
  post_number?: number;
  time?: string;
  format?: string;
  caption?: string;
  tags?: string[];
  generation_prompt?: string;
  [key: string]: any;
}

interface ContentPlanDay {
  day?: number;
  theme?: string;
  posts?: ContentPlanPost[];
  [key: string]: any;
}

interface ContentPlanViewProps {
  pageName?: string;
  contentPlan: ContentPlanDay[];
  extraMeta?: Record<string, any>;
  isEditing?: boolean;
  onDataChange?: (updated: {
    pageName?: string;
    contentPlan: ContentPlanDay[];
    extraMeta?: Record<string, any>;
  }) => void;
}

interface ContentPlanPostCardProps {
  post: ContentPlanPost;
  dayIdx: number;
  postIdx: number;
  isEditing: boolean;
  copiedId: string | null;
  onCopy: (text: string, id: string) => void;
  onPostChange: (dayIdx: number, postIdx: number, field: string, val: any) => void;
}

const ContentPlanPostCard = ({
  post,
  dayIdx,
  postIdx,
  isEditing,
  copiedId,
  onCopy,
  onPostChange,
}: ContentPlanPostCardProps) => {
  const postNum = post.post_number ?? postIdx + 1;
  const isVideo = post.format?.toLowerCase() === "video";
  const captionId = `caption-${dayIdx}-${postIdx}`;
  const tagsId = `tags-${dayIdx}-${postIdx}`;
  const promptId = `prompt-${dayIdx}-${postIdx}`;

  // Keep local string state for tags so user can type commas smoothly
  const [tagsInput, setTagsInput] = useState(() =>
    Array.isArray(post.tags) ? post.tags.join(", ") : (post.tags || "")
  );

  useEffect(() => {
    const formatted = Array.isArray(post.tags) ? post.tags.join(", ") : (post.tags || "");
    setTagsInput(formatted);
  }, [post.tags]);

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 sm:p-5 shadow-xs space-y-3.5 sm:space-y-4 transition-colors">
      {/* Post Card Header (Format is static, Time is editable in edit mode) */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 sm:pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-900 text-white">
            Post #{postNum}
          </span>
          {isEditing ? (
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 focus-within:border-[#ff9b8f] focus-within:ring-2 focus-within:ring-[#ff9b8f]/25 rounded-lg px-2 py-0.5 shadow-2xs">
              <FiClock className="w-3.5 h-3.5 text-[#ff7d6e] shrink-0" />
              <input
                type="text"
                value={post.time || ""}
                onChange={(e) => onPostChange(dayIdx, postIdx, "time", e.target.value)}
                placeholder="12:00 PM"
                className="w-24 text-xs font-medium text-slate-800 focus:outline-none bg-transparent"
              />
            </div>
          ) : post.time ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
              <FiClock className="w-3.5 h-3.5 text-slate-500" />
              {post.time}
            </span>
          ) : null}
        </div>

        {post.format && (
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold border ${isVideo
              ? "bg-orange-50 text-[#c83a2a] border-orange-200/80"
              : "bg-slate-100 text-slate-700 border-slate-200"
              }`}
          >
            {isVideo ? (
              <FiVideo className="w-3.5 h-3.5 text-[#ff7d6e]" />
            ) : (
              <FiImage className="w-3.5 h-3.5 text-slate-500" />
            )}
            {post.format}
          </span>
        )}
      </div>

      {/* Caption (Editable in edit mode) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Caption
          </span>
          {!isEditing && post.caption && (
            <button
              onClick={() => post.caption && onCopy(post.caption, captionId)}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-[#c83a2a] font-medium px-2 py-0.5 rounded-lg hover:bg-orange-50/50 transition-colors cursor-pointer"
              title="Copy Caption"
            >
              {copiedId === captionId ? (
                <>
                  <FiCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600">Copied</span>
                </>
              ) : (
                <>
                  <FiCopy className="w-3.5 h-3.5" />
                  <span>Copy Caption</span>
                </>
              )}
            </button>
          )}
        </div>
        {isEditing ? (
          <textarea
            rows={4}
            value={post.caption || ""}
            onChange={(e) => onPostChange(dayIdx, postIdx, "caption", e.target.value)}
            placeholder="Enter post caption..."
            className="w-full p-3 bg-white rounded-xl border border-slate-200 text-sm text-slate-800 leading-relaxed shadow-xs focus:outline-none focus:ring-2 focus:ring-[#ff9b8f]/25 focus:border-[#ff9b8f] resize-y"
          />
        ) : post.caption ? (
          <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
            {sanitizeText(post.caption)}
          </div>
        ) : null}
      </div>

      {/* Tags / Hashtags (Editable in edit mode) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
            <FiTag className="w-3 h-3 text-slate-400" /> Hashtags
          </span>
          {!isEditing && Array.isArray(post.tags) && post.tags.length > 0 && (
            <button
              onClick={() => {
                if (!post.tags) return;
                const allTags = post.tags
                  .map((t: string) => {
                    const trimmed = t.trim();
                    return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
                  })
                  .join(" ");
                onCopy(allTags, tagsId);
              }}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-[#c83a2a] font-medium px-2 py-0.5 rounded-lg hover:bg-orange-50/50 transition-colors cursor-pointer"
              title="Copy All Tags"
            >
              {copiedId === tagsId ? (
                <>
                  <FiCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600">Copied</span>
                </>
              ) : (
                <>
                  <FiCopy className="w-3.5 h-3.5" />
                  <span>Copy All Tags</span>
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
              const arr = val.split(",").map(t => t.trim()).filter(Boolean);
              onPostChange(dayIdx, postIdx, "tags", arr);
            }}
            placeholder="#Fashion, #Shopping (comma-separated)"
            className="w-full p-2.5 bg-white rounded-xl border border-slate-200 text-xs font-medium text-slate-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-[#ff9b8f]/25 focus:border-[#ff9b8f]"
          />
        ) : Array.isArray(post.tags) && post.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {post.tags.map((tag: string, tIdx: number) => {
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
        ) : null}
      </div>

      {/* AI Generation Prompt (Editable in edit mode) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            AI Generation Prompt
          </span>
          {!isEditing && post.generation_prompt && (
            <button
              onClick={() => post.generation_prompt && onCopy(post.generation_prompt, promptId)}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-[#c83a2a] font-medium px-2 py-0.5 rounded-lg hover:bg-orange-50/50 transition-colors cursor-pointer"
              title="Copy Generation Prompt"
            >
              {copiedId === promptId ? (
                <>
                  <FiCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600">Copied Prompt</span>
                </>
              ) : (
                <>
                  <FiCopy className="w-3.5 h-3.5" />
                  <span>Copy Prompt</span>
                </>
              )}
            </button>
          )}
        </div>
        {isEditing ? (
          <textarea
            rows={3}
            value={post.generation_prompt || ""}
            onChange={(e) => onPostChange(dayIdx, postIdx, "generation_prompt", e.target.value)}
            placeholder="Enter AI prompt for image/video generation..."
            className="w-full p-3 bg-white rounded-xl border border-slate-200 text-xs font-mono text-slate-800 leading-relaxed shadow-xs focus:outline-none focus:ring-2 focus:ring-[#ff9b8f]/25 focus:border-[#ff9b8f] resize-y"
          />
        ) : post.generation_prompt ? (
          <div className="p-3.5 text-slate-800 bg-slate-50/80 rounded-xl text-xs font-mono leading-relaxed border border-slate-200/80">
            {sanitizeText(post.generation_prompt)}
          </div>
        ) : null}
      </div>
    </div>
  );
};

const ContentPlanView = ({
  pageName,
  contentPlan,
  extraMeta,
  isEditing = false,
  onDataChange,
}: ContentPlanViewProps) => {
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

  const handleThemeChange = (dayIdx: number, val: string) => {
    if (onDataChange) {
      const updated = contentPlan.map((d, idx) => {
        if (idx !== dayIdx) return d;
        const res: ContentPlanDay = { ...d, theme: val };
        if (d.title !== undefined) {
          res.title = val;
        }
        return res;
      });
      onDataChange({ pageName, contentPlan: updated, extraMeta });
    }
  };

  const handlePostChange = (dayIdx: number, postIdx: number, field: string, val: any) => {
    if (onDataChange) {
      const updated = contentPlan.map((d, dIdx) => {
        if (dIdx !== dayIdx) return d;
        const updatedPosts = (d.posts || []).map((p, pIdx) => {
          if (pIdx !== postIdx) return p;
          return { ...p, [field]: val };
        });
        return { ...d, posts: updatedPosts };
      });
      onDataChange({ pageName, contentPlan: updated, extraMeta });
    }
  };

  const totalPosts = contentPlan.reduce(
    (sum, day) => sum + (Array.isArray(day.posts) ? day.posts.length : 0),
    0
  );
  const imagesCount = contentPlan.reduce(
    (sum, day) =>
      sum +
      (Array.isArray(day.posts)
        ? day.posts.filter((p) => p.format?.toLowerCase() === "image").length
        : 0),
    0
  );
  const videosCount = contentPlan.reduce(
    (sum, day) =>
      sum +
      (Array.isArray(day.posts)
        ? day.posts.filter((p) => p.format?.toLowerCase() === "video").length
        : 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Brand & Summary Header Card (Page name remains static) */}
      {pageName && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 flex-1">
            <div className="w-11 h-11 rounded-xl bg-orange-50 border border-orange-200/80 flex items-center justify-center text-[#ff7d6e] shrink-0">
              <FiLayers className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Page / Brand</span>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                {pageName}
              </h3>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 bg-orange-50 text-orange-900 rounded-full text-xs font-semibold border border-orange-200/80 flex items-center gap-1.5">
              {totalPosts} {totalPosts === 1 ? "Post" : "Posts"}
            </span>
            {imagesCount > 0 && (
              <span className="px-3 py-1 bg-sky-50 text-sky-700 rounded-full text-xs font-semibold border border-sky-200 flex items-center gap-1.5">
                <FiImage className="w-3.5 h-3.5 text-sky-600" />
                {imagesCount} {imagesCount === 1 ? "Image" : "Images"}
              </span>
            )}
            {videosCount > 0 && (
              <span className="px-3 py-1 bg-orange-50 text-[#c83a2a] rounded-full text-xs font-semibold border border-orange-200/80 flex items-center gap-1.5">
                <FiVideo className="w-3.5 h-3.5 text-[#ff7d6e]" />
                {videosCount} {videosCount === 1 ? "Video" : "Videos"}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Extra Top-Level Meta Fields (Static) */}
      {extraMeta && Object.keys(extraMeta).length > 0 && (
        <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3.5 sm:p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(extraMeta).map(([k, v]) => (
            <div key={k} className="space-y-0.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {k.replace(/_/g, " ")}
              </span>
              <p className="text-sm font-medium text-slate-800">{String(v)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Content Plan Sections */}
      <div className="space-y-6">
        {contentPlan.map((dayPlan, dayIdx) => {
          const posts = Array.isArray(dayPlan.posts) ? dayPlan.posts : [];
          return (
            <div
              key={dayIdx}
              className="overflow-hidden"
            >
              {/* Section Header (Day 1 chip removed completely, theme title is editable) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1 sm:px-0">
                <div className="flex items-center gap-3 flex-1">
                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-1 max-w-xl">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400 shrink-0">Title:</span>
                      <input
                        type="text"
                        value={dayPlan.theme || dayPlan.title || ""}
                        onChange={(e) => handleThemeChange(dayIdx, e.target.value)}
                        placeholder="Content Title / Theme..."
                        className="w-full text-sm sm:text-base font-semibold text-slate-900 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-xs focus:outline-none focus:ring-2 focus:ring-[#ff9b8f]/25 focus:border-[#ff9b8f]"
                      />
                    </div>
                  ) : (dayPlan.theme || dayPlan.title) ? (
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                      {sanitizeText(dayPlan.theme || dayPlan.title || "")}
                    </h3>
                  ) : null}
                </div>
                <span className="text-xs font-medium text-slate-500 bg-white border border-slate-200 px-3 py-1 rounded-full w-max shadow-xs">
                  {posts.length} {posts.length === 1 ? "Scheduled Post" : "Scheduled Posts"}
                </span>
              </div>

              {/* Posts List */}
              <div className="py-3.5 sm:py-5">
                {posts.length === 0 ? (
                  <p className="text-sm text-slate-400 italic">No posts scheduled.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {posts.map((post, postIdx) => (
                      <ContentPlanPostCard
                        key={postIdx}
                        post={post}
                        dayIdx={dayIdx}
                        postIdx={postIdx}
                        isEditing={isEditing}
                        copiedId={copiedId}
                        onCopy={handleCopy}
                        onPostChange={handlePostChange}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function TemplateRenderer({
  data,
  level = 0,
  isEditing = false,
  onDataChange,
}: TemplateRendererProps) {
  if (data === null || data === undefined) {
    return null;
  }

  // 1. Detect Content Plan structure at root level
  if (level === 0 && typeof data === "object" && !Array.isArray(data) && data !== null) {
    if (Array.isArray(data.content_plan) && data.content_plan.length > 0) {
      const pageName = data.page_name || data.page || data.brand || data.channel;
      const extraMeta: Record<string, any> = {};
      Object.entries(data).forEach(([k, v]) => {
        if (k !== "content_plan" && k !== "page_name" && typeof v !== "object") {
          extraMeta[k] = v;
        }
      });
      const handlePlanChange = (updated: {
        pageName?: string;
        contentPlan: ContentPlanDay[];
        extraMeta?: Record<string, any>;
      }) => {
        if (!onDataChange) return;
        const newData = {
          ...data,
          ...(updated.pageName !== undefined ? { page_name: updated.pageName } : {}),
          content_plan: updated.contentPlan,
          ...(updated.extraMeta || {}),
        };
        onDataChange(newData);
      };

      return (
        <ContentPlanView
          pageName={pageName}
          contentPlan={data.content_plan}
          extraMeta={extraMeta}
          isEditing={isEditing}
          onDataChange={handlePlanChange}
        />
      );
    }

    // 1b. Detect Captions List structure at root level (e.g. { "captions": [...] })
    if (Array.isArray(data.captions) && data.captions.length > 0) {
      return (
        <CaptionsTemplateView
          captions={data.captions}
          isEditing={isEditing}
          onDataChange={(updatedCaptions) => {
            if (onDataChange) {
              onDataChange({ ...data, captions: updatedCaptions });
            }
          }}
        />
      );
    }
  }

  // 2. Direct array representing captions list
  if (
    Array.isArray(data) &&
    data.length > 0 &&
    data[0] &&
    typeof data[0] === "object" &&
    data[0].caption !== undefined &&
    !Array.isArray(data[0].posts)
  ) {
    return (
      <CaptionsTemplateView
        captions={data}
        isEditing={isEditing}
        onDataChange={onDataChange}
      />
    );
  }

  // 2. Direct array representing content plan (e.g. array of days with posts)
  if (
    Array.isArray(data) &&
    data.length > 0 &&
    data[0] &&
    typeof data[0] === "object" &&
    Array.isArray(data[0].posts)
  ) {
    const handleArrayPlanChange = (updated: { contentPlan: ContentPlanDay[] }) => {
      if (onDataChange) {
        onDataChange(updated.contentPlan);
      }
    };
    return (
      <ContentPlanView
        contentPlan={data}
        isEditing={isEditing}
        onDataChange={handleArrayPlanChange}
      />
    );
  }

  const formatKey = (key: string) => {
    return key
      .replace(/_/g, " ")
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase());
  };

  if (Array.isArray(data)) {
    // If array of strings
    if (data.every((item) => typeof item === "string")) {
      return (
        <ul className="list-none bg-white border border-slate-200/80 rounded-xl shadow-xs p-2.5 m-0 w-full overflow-x-auto pb-2 scrollbar-thin">
          {data.map((item, index) => (
            <EditableListItem key={index} initialValue={item} isUrl={checkIsUrl(item)} />
          ))}
        </ul>
      );
    }

    // Array of objects (generic fallback if not caught by SceneTable)
    if (data.every((item) => typeof item === "object" && item !== null)) {
      return (
        <ul className="space-y-4 list-none p-0 m-0">
          {data.map((item, index) => (
            <li key={index} className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80">
              <TemplateRenderer data={item} level={level + 1} />
            </li>
          ))}
        </ul>
      );
    }

    return (
      <ul className="space-y-4 list-none p-0 m-0">
        {data.map((item, index) => (
          <li key={index} className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80">
            {typeof item === "object" && item !== null ? (
              <TemplateRenderer data={item} level={level + 1} />
            ) : checkIsUrl(String(item)) ? (
              <a href={getHref(String(item))} target={getHref(String(item)).startsWith("mailto:") ? undefined : "_blank"} rel="noopener noreferrer" className="text-[#c83a2a] hover:underline flex items-center gap-1 font-medium">
                {sanitizeText(String(item))} <FiExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <span className="text-slate-700">
                {sanitizeText(String(item))}
              </span>
            )}
          </li>
        ))}
      </ul>
    );
  }

  if (typeof data === "object" && data !== null) {
    return (
      <div className="grid grid-cols-1 gap-6">
        {Object.entries(data)
          .filter(([k]) => k !== "media_download_instructions" && k !== "algorithm_reasoning")
          .map(([key, value]) => {
            const isComplex = typeof value === "object" && value !== null;
            const label = formatKey(key);

            // Sub-level Content Plan check
            if (key === "content_plan" && Array.isArray(value)) {
              return (
                <div key={key} className="space-y-2 mt-4 md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-900 mb-1">{label}</label>
                  <ContentPlanView
                    contentPlan={value}
                    isEditing={isEditing}
                    onDataChange={(updated) => {
                      if (onDataChange) {
                        onDataChange({
                          ...data,
                          content_plan: updated.contentPlan,
                        });
                      }
                    }}
                  />
                </div>
              );
            }

            // Array of Objects - Generic Table Check
            const isArrayOfObjects = Array.isArray(value) && value.length > 0 && value.every(v => typeof v === 'object' && v !== null && !Array.isArray(v));
            if (isArrayOfObjects) {
              return (
                <div key={key} className="space-y-2 mt-4 min-w-0">
                  <label className="block text-sm font-semibold text-slate-900 mb-1">{label}</label>
                  <SceneTable items={value} />
                </div>
              );
            }

            // Array of Strings - Tags Check
            const isTagArray = Array.isArray(value) && value.every(v => typeof v === 'string') && key.toLowerCase().includes('tag');
            if (isTagArray) {
              return (
                <div key={key} className="space-y-2 min-w-0">
                  <label className="block text-sm font-semibold text-slate-900 mb-1">{label}</label>
                  <TagsEditor initialTags={value} />
                </div>
              );
            }

            const isLongText = typeof value === "string" && (value.length > 100 || value.includes("\n"));
            const isSimpleArray = Array.isArray(value);

            return (
              <div key={key} className={`space-y-2 min-w-0 ${(isComplex && !isSimpleArray) || isLongText ? 'md:col-span-2' : ''}`}>
                <label className="block text-sm font-semibold text-slate-900 mb-1">
                  {label}
                </label>

                {isComplex ? (
                  <TemplateRenderer
                    data={value}
                    level={level + 1}
                    isEditing={isEditing}
                    onDataChange={(newVal) => {
                      if (onDataChange) {
                        onDataChange({ ...data, [key]: newVal });
                      }
                    }}
                  />
                ) : typeof value === "string" && checkIsUrl(value) ? (
                  <ul className="list-none p-0 m-0">
                    <li className="overflow-x-auto w-full bg-white border border-slate-200/80 shadow-xs rounded-xl">
                      <a href={getHref(value)} target={getHref(value).startsWith("mailto:") ? undefined : "_blank"} rel="noopener noreferrer" className="text-[#c83a2a] hover:underline inline-flex items-center gap-1 p-2.5 whitespace-nowrap font-medium">
                        {value} <FiExternalLink className="w-3 h-3 flex-shrink-0" />
                      </a>
                    </li>
                  </ul>
                ) : isLongText ? (
                  <PromptTextarea initialValue={value} />
                ) : (
                  <input
                    type={typeof value === "number" ? "number" : "text"}
                    readOnly={!isEditing}
                    value={sanitizeText(String(value))}
                    onChange={(e) => {
                      if (onDataChange) {
                        onDataChange({
                          ...data,
                          [key]: typeof value === "number" ? Number(e.target.value) : e.target.value,
                        });
                      }
                    }}
                    className={`w-full p-2.5 bg-white rounded-xl shadow-xs text-sm text-slate-800 transition-all ${isEditing
                      ? "border border-[#ff9b8f] focus:outline-none focus:ring-2 focus:ring-[#ff9b8f]/25"
                      : "border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#ff9b8f]/25 focus:border-[#ff9b8f]"
                      }`}
                  />
                )}
              </div>
            );
          })}

        {/* Custom Grouping for Media Download Instructions + Algorithm Reasoning */}
        {(data.media_download_instructions || data.algorithm_reasoning) && (
          <div className="md:col-span-2 space-y-2 min-w-0">
            <div className="flex flex-col lg:flex-row gap-4">
              {data.media_download_instructions && typeof data.media_download_instructions === 'object' && (
                <>
                  {Object.entries(data.media_download_instructions).map(([k, v]) => (
                    <div key={k} className="flex-1 min-w-[120px] space-y-2">
                      <label className="block text-sm font-semibold text-slate-900 mb-1">{formatKey(k)}</label>
                      <input
                        type={typeof v === "number" ? "number" : "text"}
                        readOnly={!isEditing}
                        value={sanitizeText(String(v))}
                        onChange={(e) => {
                          if (onDataChange) {
                            onDataChange({
                              ...data,
                              media_download_instructions: {
                                ...(data.media_download_instructions as object),
                                [k]: typeof v === "number" ? Number(e.target.value) : e.target.value
                              }
                            });
                          }
                        }}
                        className={`w-full p-2.5 bg-white rounded-xl shadow-xs text-sm text-slate-800 transition-all ${isEditing
                            ? "border border-[#ff9b8f] focus:outline-none focus:ring-2 focus:ring-[#ff9b8f]/25"
                            : "border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#ff9b8f]/25 focus:border-[#ff9b8f]"
                          }`}
                      />
                    </div>
                  ))}
                </>
              )}

              {data.algorithm_reasoning && (
                <div className="flex-[2] min-w-[250px] space-y-2">
                  <label className="block text-sm font-semibold text-slate-900 mb-1">Algorithm Reasoning</label>
                  <PromptTextarea initialValue={sanitizeText(String(data.algorithm_reasoning))} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Primitive fallback
  return (
    <span className="text-slate-700">{sanitizeText(String(data))}</span>
  );
}
