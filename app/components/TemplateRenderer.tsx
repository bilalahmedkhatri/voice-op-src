"use client";

import React, { useState } from "react";
import { FiCopy, FiEdit2, FiCheck, FiSave, FiExternalLink } from "react-icons/fi";

interface TemplateRendererProps {
  data: any;
  level?: number;
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

  return (
    <div className="relative group">
      <div className="absolute top-2 right-2 flex gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        {isEditing ? (
          <button
            onClick={() => setIsEditing(false)}
            className="p-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-sm flex items-center justify-center transition-colors"
            title="Save changes"
          >
            <FiSave className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="p-1.5 bg-white border border-slate-200 text-slate-600 rounded-md hover:bg-slate-50 shadow-sm flex items-center justify-center transition-colors"
            title="Edit text"
          >
            <FiEdit2 className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={handleCopy}
          className="p-1.5 bg-white border border-slate-200 text-slate-600 rounded-md hover:bg-slate-50 shadow-sm flex items-center justify-center transition-colors"
          title="Copy text"
        >
          {copied ? <FiCheck className="w-4 h-4 text-green-500" /> : <FiCopy className="w-4 h-4" />}
        </button>
      </div>

      <textarea
        readOnly={!isEditing}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className={`w-full min-h-[350px] p-3 pt-10 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm overflow-y-auto resize-none text-slate-800 ${isEditing ? "ring-2 ring-blue-500/50 border-blue-500" : ""
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
    <li className="flex items-center gap-2 group hover:bg-slate-50 transition-colors rounded-sm w-max min-w-full pr-4">
      {isEditing ? (
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="flex-1 text-sm px-1 py-0.5 border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
        />
      ) : isUrl ? (
        <a href={getHref(value)} target={getHref(value).startsWith("mailto:") ? undefined : "_blank"} rel="noopener noreferrer" className="flex-1 text-sm text-blue-600 hover:underline flex items-center gap-1 whitespace-nowrap">
          {value} <FiExternalLink className="w-3 h-3 shrink-0 opacity-50" />
        </a>
      ) : (
        <span className="flex-1 text-sm text-slate-700 whitespace-nowrap">{value}</span>
      )}

      <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {isEditing ? (
          <button onClick={() => setIsEditing(false)} className="p-0.5 text-blue-600 hover:text-blue-700"><FiSave className="w-3.5 h-3.5" /></button>
        ) : (
          <button onClick={() => setIsEditing(true)} className="p-0.5 text-slate-400 hover:text-blue-600"><FiEdit2 className="w-3.5 h-3.5" /></button>
        )}
        <button onClick={handleCopy} className="p-0.5 text-slate-400 hover:text-blue-600">
          {copied ? <FiCheck className="w-3.5 h-3.5 text-green-500" /> : <FiCopy className="w-3.5 h-3.5" />}
        </button>
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
    <div className="p-4 bg-white border border-slate-300 shadow-sm rounded-lg relative group">
      <div className="absolute top-2 right-2 flex gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        {isEditing ? (
          <button onClick={() => setIsEditing(false)} className="p-1.5 bg-blue-600 text-white rounded-md shadow-sm"><FiSave className="w-4 h-4" /></button>
        ) : (
          <button onClick={() => setIsEditing(true)} className="p-1.5 bg-white border border-slate-200 text-slate-600 rounded-md shadow-sm"><FiEdit2 className="w-4 h-4" /></button>
        )}
        <button onClick={handleCopy} className="p-1.5 bg-white border border-slate-200 text-slate-600 rounded-md shadow-sm">
          {copied ? <FiCheck className="w-4 h-4 text-green-500" /> : <FiCopy className="w-4 h-4" />}
        </button>
      </div>

      {isEditing ? (
        <textarea
          value={textValue}
          onChange={(e) => setTextValue(e.target.value)}
          className="w-full min-h-[100px] mt-6 p-2 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      ) : (
        <div className="flex flex-wrap gap-2 mt-2">
          {currentTags.map((tag, i) => (
            <span key={i} className="px-3 py-1 bg-orange-100 text-orange-800 text-xs font-semibold rounded-full border border-orange-200">
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
    if (k.includes("prompt") || k.includes("description") || k.includes("script")) {
      return "w-[60%] min-w-[300px] whitespace-nowrap px-6";
    }
    if (k.includes("title") || k.includes("topic") || k.includes("name")) {
      return "min-w-[200px] whitespace-nowrap px-6";
    }
    if (k.includes("tag")) {
      return "min-w-[100px] whitespace-nowrap px-6";
    }
    if (k.includes("link") || k.includes("url") || k.includes("resource")) {
      return "min-w-[300px] whitespace-nowrap px-6";
    }
    return "w-auto whitespace-nowrap px-6";
  };

  const renderTableCell = (value: any, keyName: string) => {
    if (value === undefined || value === null) return "-";

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
      return (
        <ul className="flex flex-wrap gap-1.5 list-none p-0 m-0">
          {itemsToRender.map((tag, idx) => {
            const formatted = tag.trim().startsWith('#') ? tag.trim() : `#${tag.trim()}`;
            return (
              <li key={idx} className="px-2 py-0.5 bg-orange-100 text-orange-800 text-[11px] font-semibold rounded-full border border-orange-200 whitespace-nowrap">
                {formatted}
              </li>
            );
          })}
        </ul>
      );
    }

    if (itemsToRender.length > 1 || (itemsToRender.length === 1 && checkIsUrl(itemsToRender[0]))) {
      return (
        <ul className="flex flex-col p-0 m-0 list-none space-y-1">
          {itemsToRender.map((v, idx) => {
            const sanitized = sanitizeText(v);
            if (checkIsUrl(sanitized)) {
              return (
                <li key={idx} className="p-0 m-0 leading-[1.2]">
                  <a href={getHref(sanitized)} target={getHref(sanitized).startsWith("mailto:") ? undefined : "_blank"} rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 whitespace-nowrap">
                    <span className="flex-1">{sanitized}</span>
                    <FiExternalLink className="w-3 h-3 flex-shrink-0 opacity-50" />
                  </a>
                </li>
              );
            }
            return <li key={idx} className="p-0 m-0 leading-[1.2]">{sanitized}</li>;
          })}
        </ul>
      );
    }

    return <div className="line-clamp-6">{sanitizeText(String(value))}</div>;
  };

  return (
    <div className="w-full border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
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

export default function TemplateRenderer({ data, level = 0 }: TemplateRendererProps) {
  if (data === null || data === undefined) {
    return null;
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
        <ul className="list-none bg-white border border-slate-300 rounded-md shadow-sm p-2 m-0 w-full overflow-x-auto pb-2 scrollbar-thin">
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
            <li key={index} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <TemplateRenderer data={item} level={level + 1} />
            </li>
          ))}
        </ul>
      );
    }

    return (
      <ul className="space-y-4 list-none p-0 m-0">
        {data.map((item, index) => (
          <li key={index} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            {typeof item === "object" && item !== null ? (
              <TemplateRenderer data={item} level={level + 1} />
            ) : checkIsUrl(String(item)) ? (
              <a href={getHref(String(item))} target={getHref(String(item)).startsWith("mailto:") ? undefined : "_blank"} rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
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
      <div className="space-y-6">
        {Object.entries(data).map(([key, value]) => {
          const isComplex = typeof value === "object" && value !== null;
          const label = formatKey(key);

          // Array of Objects - Generic Table Check
          const isArrayOfObjects = Array.isArray(value) && value.length > 0 && value.every(v => typeof v === 'object' && v !== null && !Array.isArray(v));
          if (isArrayOfObjects) {
            return (
              <div key={key} className="space-y-2 mt-4">
                <label className="block text-sm font-semibold text-slate-900 mb-1">{label}</label>
                <SceneTable items={value} />
              </div>
            );
          }

          // Array of Strings - Tags Check
          const isTagArray = Array.isArray(value) && value.every(v => typeof v === 'string') && key.toLowerCase().includes('tag');
          if (isTagArray) {
            return (
              <div key={key} className="space-y-2">
                <label className="block text-sm font-semibold text-slate-900 mb-1">{label}</label>
                <TagsEditor initialTags={value} />
              </div>
            );
          }

          return (
            <div key={key} className="space-y-2">
              <label className="block text-sm font-semibold text-slate-900 mb-1">
                {label}
              </label>

              {isComplex ? (
                // <div className="p-2 sm:p-5 bg-white border border-slate-200 rounded-xl shadow-sm mt-3">
                <TemplateRenderer data={value} level={level + 1} />
                // </div>
              ) : typeof value === "string" && checkIsUrl(value) ? (
                <ul className="list-none p-0 m-0">
                  <li className="overflow-x-auto w-full bg-white border border-slate-300 shadow-sm rounded-md">
                    <a href={getHref(value)} target={getHref(value).startsWith("mailto:") ? undefined : "_blank"} rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1 p-2.5 whitespace-nowrap">
                      {value} <FiExternalLink className="w-3 h-3 flex-shrink-0" />
                    </a>
                  </li>
                </ul>
              ) : typeof value === "string" && (value.length > 100 || value.includes("\n")) ? (
                <PromptTextarea initialValue={value} />
              ) : (
                <input
                  type={typeof value === "number" ? "number" : "text"}
                  readOnly
                  value={sanitizeText(String(value))}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-800"
                />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Primitive fallback
  return (
    <span className="text-slate-700">{sanitizeText(String(data))}</span>
  );
}
