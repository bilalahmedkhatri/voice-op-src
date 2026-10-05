"use client";

import React from "react";
import JsonGenerator2UI from "./JsonGenerator2UI";
import TemplateRenderer from "./TemplateRenderer";

interface Props {
  data: any;
  isEditing?: boolean;
  onDataChange?: (newData: any) => void;
}

export default function JsonTemplateTest({ data, isEditing, onDataChange }: Props) {
  if (!data || typeof data !== "object") return null;

  // Detect YouTube Strategy format (Generation 2)
  // Usually contains these specific keys
  const isYouTubeStrategy = 
    data.content_strategy !== undefined || 
    data.general_information !== undefined || 
    data.channel_info !== undefined ||
    (data.channel_name !== undefined && data.content_plan === undefined);

  if (isYouTubeStrategy) {
    return (
      <JsonGenerator2UI 
        data={data} 
        isEditing={isEditing} 
        onDataChange={onDataChange} 
      />
    );
  }

  // Fallback to Facebook / Generic format (Generation 1)
  return (
    <TemplateRenderer 
      data={data} 
      isEditing={isEditing} 
      onDataChange={onDataChange} 
    />
  );
}
