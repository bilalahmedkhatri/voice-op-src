"use client";

import React, { useState } from "react";
import { FiCopy, FiEdit2, FiCheck, FiSave, FiExternalLink } from "react-icons/fi";

interface TemplateRendererProps {
  data: any;
  level?: number;
}

const sanitizeText = (text: string) => text.replace(/—/g, "-");

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
        className={`w-full min-h-[250px] p-3 pt-10 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm overflow-y-auto resize-none text-slate-800 ${
          isEditing ? "ring-2 ring-blue-500/50 border-blue-500" : ""
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
    } catch (err) {}
  };

  return (
    <div className="flex items-start gap-2 group hover:bg-slate-50 transition-colors py-0.5 rounded-sm">
      {isEditing ? (
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="flex-1 text-sm p-1 border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none min-h-[40px]"
        />
      ) : isUrl ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="flex-1 text-sm text-blue-600 hover:underline break-words flex items-center gap-1">
          {value} <FiExternalLink className="w-3 h-3 inline opacity-50" />
        </a>
      ) : (
        <span className="flex-1 text-sm text-slate-700 break-words">{value}</span>
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
    </div>
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
    } catch (err) {}
  };

  const currentTags = textValue.split(",").map(t => t.trim()).filter(Boolean);

  return (
    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg relative group">
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
      return "w-[60%] min-w-[300px] whitespace-normal break-words px-6";
    }
    return "w-auto whitespace-nowrap px-6";
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
                    {item[k] !== undefined ? sanitizeText(String(item[k])) : "-"}
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

  const checkIsUrl = (str: string) => {
    try {
      new URL(str);
      return str.startsWith("http");
    } catch (_) {
      return false;
    }
  };

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
        <div className="space-y-0.5">
          {data.map((item, index) => (
            <EditableListItem key={index} initialValue={item} isUrl={checkIsUrl(item)} />
          ))}
        </div>
      );
    }

    // Array of objects (generic fallback if not caught by SceneTable)
    if (data.every((item) => typeof item === "object" && item !== null)) {
      return (
        <div className="space-y-4">
          {data.map((item, index) => (
            <div key={index} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <TemplateRenderer data={item} level={level + 1} />
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {data.map((item, index) => (
          <div key={index} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            {typeof item === "object" && item !== null ? (
              <TemplateRenderer data={item} level={level + 1} />
            ) : checkIsUrl(String(item)) ? (
              <a href={String(item)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                {sanitizeText(String(item))} <FiExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <span className="text-slate-700">
                {sanitizeText(String(item))}
              </span>
            )}
          </div>
        ))}
      </div>
    );
  }

  if (typeof data === "object" && data !== null) {
    return (
      <div className={`space-y-6 ${level > 0 ? "pl-2" : ""}`}>
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
                <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm mt-3">
                  <TemplateRenderer data={value} level={level + 1} />
                </div>
              ) : typeof value === "string" && checkIsUrl(value) ? (
                <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 bg-slate-50 p-2.5 rounded-md border border-slate-200">
                  {value} <FiExternalLink className="w-3 h-3" />
                </a>
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
