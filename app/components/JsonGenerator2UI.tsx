"use client";

import React from "react";
import { FiExternalLink } from "react-icons/fi";
import TemplateRenderer, {
  SceneTable,
  PromptTextarea,
  formatKey,
  sanitizeText,
  checkIsUrl,
  getHref,
} from "./TemplateRenderer";

interface Props {
  data: any;
  isEditing?: boolean;
  onDataChange?: (newData: any) => void;
}

export default function JsonGenerator2UI({ data, isEditing, onDataChange }: Props) {
  if (!data || typeof data !== "object") return null;

  const handleFieldChange = (keyPath: string[], newValue: any) => {
    if (!onDataChange) return;
    const newData = JSON.parse(JSON.stringify(data)); // deep clone
    let current = newData;
    for (let i = 0; i < keyPath.length - 1; i++) {
      if (!current[keyPath[i]]) current[keyPath[i]] = {};
      current = current[keyPath[i]];
    }
    current[keyPath[keyPath.length - 1]] = newValue;
    onDataChange(newData);
  };

  const renderField = (label: string, value: any, keyPath: string[]) => {
    const isUrl = typeof value === "string" && checkIsUrl(value);
    
    return (
      <div className="space-y-1 min-w-0" key={keyPath.join(".")}>
        <label className="block text-sm font-semibold text-slate-700">{label}</label>
        {isUrl && !isEditing ? (
          <a
            href={getHref(value)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#c83a2a] hover:underline flex items-center gap-1 font-medium truncate"
          >
            {value} <FiExternalLink className="w-3 h-3 flex-shrink-0" />
          </a>
        ) : (
          <input
            type={typeof value === "number" ? "number" : "text"}
            readOnly={!isEditing}
            value={value || ""}
            onChange={(e) => handleFieldChange(keyPath, typeof value === "number" ? Number(e.target.value) : e.target.value)}
            className={`w-full p-2.5 bg-white rounded-xl shadow-xs text-sm text-slate-800 transition-all ${
              isEditing
                ? "border border-[#ff9b8f] focus:outline-none focus:ring-2 focus:ring-[#ff9b8f]/25"
                : "border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#ff9b8f]/25 focus:border-[#ff9b8f]"
            }`}
          />
        )}
      </div>
    );
  };

  // Identify specific keys to render custom layouts for
  const customHandledKeys = new Set([
    "general_information",
    "channel_info",
    "channel_name",
    "main_title",
    "niche",
    "conversation_url",
    "content_strategy",
    "media_download_instructions",
    "algorithm_reasoning",
    "research_resources"
  ]);

  return (
    <div className="space-y-8">
      
      {/* 1. General Information */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 space-y-6">
        <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-3">General Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data.general_information?.channel_name !== undefined && renderField("Channel Name", data.general_information.channel_name, ["general_information", "channel_name"])}
          {data.general_information?.general_name !== undefined && renderField("Channel Name", data.general_information.general_name, ["general_information", "general_name"])}
          {data.general_information?.main_title !== undefined && renderField("Main Title", data.general_information.main_title, ["general_information", "main_title"])}
          {data.general_information?.niche !== undefined && renderField("Niche", data.general_information.niche, ["general_information", "niche"])}
          {data.general_information?.conversation_url !== undefined && renderField("Conversation URL", data.general_information.conversation_url, ["general_information", "conversation_url"])}

          {(!data.general_information) && data.channel_info?.channel_name !== undefined && renderField("Channel Name", data.channel_info.channel_name, ["channel_info", "channel_name"])}
          {(!data.general_information) && data.channel_info?.main_title !== undefined && renderField("Main Title", data.channel_info.main_title, ["channel_info", "main_title"])}
          {(!data.general_information) && data.channel_info?.niche !== undefined && renderField("Niche", data.channel_info.niche, ["channel_info", "niche"])}
          {(!data.general_information) && data.channel_info?.conversation_url !== undefined && renderField("Conversation URL", data.channel_info.conversation_url, ["channel_info", "conversation_url"])}

          {(!data.general_information && !data.channel_info) && data.channel_name !== undefined && renderField("Channel Name", data.channel_name, ["channel_name"])}
          {(!data.general_information && !data.channel_info) && data.main_title !== undefined && renderField("Main Title", data.main_title, ["main_title"])}
          {(!data.general_information && !data.channel_info) && data.niche !== undefined && renderField("Niche", data.niche, ["niche"])}
          {(!data.general_information && !data.channel_info) && data.conversation_url !== undefined && renderField("Conversation URL", data.conversation_url, ["conversation_url"])}
        </div>
      </div>

      {/* 2. Content Strategy */}
      {data.content_strategy && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 space-y-8">
          <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-3">Content Strategy</h2>
          
          {(() => {
            const keys = Object.keys(data.content_strategy);
            
            // Extract long videos to merge them into a single table
            const longVideoKeys = keys.filter(k => k.startsWith('long_video') || k.includes('long_video'));
            const otherKeys = keys.filter(k => !longVideoKeys.includes(k));
            
            const longVideos = longVideoKeys.map(k => {
              const item = data.content_strategy[k];
              return Array.isArray(item) ? item[0] : item; // assuming single object per long_video_X key
            }).filter(Boolean);

            return (
              <>
                {otherKeys.map(k => {
                  const v = data.content_strategy[k];
                  return (
                    <div key={k} className="space-y-3">
                      <h3 className="text-lg font-semibold text-slate-800">{formatKey(k)}</h3>
                      <div className="overflow-x-auto w-full">
                        {typeof v === 'object' && v !== null ? (
                          <SceneTable items={Array.isArray(v) ? v : [v]} />
                        ) : (
                          <TemplateRenderer data={v} isEditing={isEditing} onDataChange={(newVal) => handleFieldChange(["content_strategy", k], newVal)} />
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {longVideos.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-slate-800">Long Videos</h3>
                    <div className="overflow-x-auto w-full">
                      <SceneTable items={longVideos} />
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* 3. Media & Algorithm */}
      {(data.media_download_instructions || data.algorithm_reasoning) && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 space-y-4">
          <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-3">Media Download Instructions</h2>
          <div className="flex flex-col lg:flex-row gap-6">
            {data.media_download_instructions && typeof data.media_download_instructions === 'object' && (
              <>
                {Object.entries(data.media_download_instructions).map(([k, v]) => (
                  <div key={k} className="flex-1 min-w-[120px] space-y-1">
                    <label className="block text-sm font-semibold text-slate-700">{formatKey(k)}</label>
                    <input
                      type={typeof v === "number" ? "number" : "text"}
                      readOnly={!isEditing}
                      value={sanitizeText(String(v))}
                      onChange={(e) => handleFieldChange(["media_download_instructions", k], typeof v === "number" ? Number(e.target.value) : e.target.value)}
                      className={`w-full p-2.5 bg-slate-50 border rounded-xl text-sm transition-all ${
                        isEditing
                          ? "border-[#ff9b8f] focus:outline-none focus:ring-2 focus:ring-[#ff9b8f]/25 bg-white"
                          : "border-slate-200 focus:outline-none"
                      }`}
                    />
                  </div>
                ))}
              </>
            )}

            {data.algorithm_reasoning && (
              <div className="flex-[2] min-w-[250px] space-y-1">
                <label className="block text-sm font-semibold text-slate-700">Algorithm Reasoning</label>
                <PromptTextarea 
                  initialValue={sanitizeText(String(data.algorithm_reasoning))}
                  onValueChange={(val) => handleFieldChange(["algorithm_reasoning"], val)}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Research Resources */}
      {data.research_resources && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 space-y-4">
          <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-3">Research Resources</h2>
          <SceneTable items={Array.isArray(data.research_resources) ? data.research_resources : [data.research_resources]} />
        </div>
      )}

      {/* 5. Unhandled Remaining Fields */}
      {Object.keys(data).filter(k => !customHandledKeys.has(k)).length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 space-y-6">
          <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-3">Additional Details</h2>
          <div className="grid grid-cols-1 gap-6">
            {Object.keys(data)
              .filter(k => !customHandledKeys.has(k))
              .map(key => (
                <div key={key} className="space-y-2">
                  <h3 className="text-sm font-semibold text-slate-700">{formatKey(key)}</h3>
                  <TemplateRenderer 
                    data={data[key]} 
                    isEditing={isEditing} 
                    onDataChange={(val) => handleFieldChange([key], val)}
                  />
                </div>
              ))}
          </div>
        </div>
      )}

    </div>
  );
}
