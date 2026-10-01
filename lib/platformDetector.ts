export type PlatformType = "youtube" | "facebook" | "unknown";

/**
 * Detects whether a JSON template belongs to YouTube Strategy or Facebook Social Media.
 */
export function detectTemplatePlatform(jsonData: any): PlatformType {
  if (!jsonData || typeof jsonData !== "object") return "unknown";

  // Check YouTube indicators
  if (
    jsonData.content_strategy?.long_video ||
    (Array.isArray(jsonData.content_strategy?.shorts) && jsonData.content_strategy.shorts.length > 0) ||
    jsonData.channel_info ||
    jsonData.media_assets ||
    jsonData.research_data
  ) {
    return "youtube";
  }

  // Check Facebook indicators
  if (
    Array.isArray(jsonData.content_plan) ||
    Array.isArray(jsonData.captions) ||
    jsonData.page_name ||
    Array.isArray(jsonData.posts)
  ) {
    return "facebook";
  }

  // Deep inspection fallback
  const keys = Object.keys(jsonData).map((k) => k.toLowerCase());
  if (keys.some((k) => k.includes("youtube") || k.includes("short") || k.includes("video"))) {
    return "youtube";
  }
  if (keys.some((k) => k.includes("facebook") || k.includes("post") || k.includes("caption") || k.includes("social"))) {
    return "facebook";
  }

  return "unknown";
}

/**
 * Helper to get the correct content view URL based on template platform.
 */
export function getContentUrl(templateId: string, jsonData: any): string {
  const platform = detectTemplatePlatform(jsonData);
  if (platform === "youtube") {
    return `/youtube/content?id=${templateId}`;
  }
  if (platform === "facebook") {
    return `/facebook/content?id=${templateId}`;
  }
  return `/content?id=${templateId}`;
}

/**
 * Helper to get the correct detail URL based on template platform.
 */
export function getDetailUrl(templateId: string, itemId: string, jsonData?: any): string {
  const platform = jsonData ? detectTemplatePlatform(jsonData) : "unknown";
  if (platform === "youtube") {
    return `/youtube/content/detail?templateId=${templateId}&itemId=${itemId}`;
  }
  if (platform === "facebook") {
    return `/facebook/content/detail?templateId=${templateId}&itemId=${itemId}`;
  }
  return `/content/detail?templateId=${templateId}&itemId=${itemId}`;
}
