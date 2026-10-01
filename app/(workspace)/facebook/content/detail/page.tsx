"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FiArrowLeft,
  FiRefreshCw,
  FiAlertCircle,
  FiSave,
  FiCheck,
  FiCopy,
  FiTag,
  FiShare2,
  FiImage,
  FiSmile,
  FiThumbsUp,
  FiMessageSquare,
  FiShare,
} from "react-icons/fi";

export default function FacebookPostDetailPage() {
  const router = useRouter();
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [itemId, setItemId] = useState<string | null>(null);
  const [template, setTemplate] = useState<any>(null);
  const [post, setPost] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit fields
  const [caption, setCaption] = useState<string>("");
  const [prompt, setPrompt] = useState<string>("");
  const [tags, setTags] = useState<string>("");
  const [status, setStatus] = useState<string>("pending");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchPostDetail = async (tId: string, iId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch(`/api/templates?id=${tId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch template");

      const t = data.template;
      setTemplate(t);

      let found: any = null;
      const plan = t.json_data?.content_plan;
      const captions = t.json_data?.captions;
      const posts = t.json_data?.posts;

      if (Array.isArray(plan)) {
        for (let d = 0; d < plan.length; d++) {
          const day = plan[d];
          if (Array.isArray(day.posts)) {
            for (let p = 0; p < day.posts.length; p++) {
              const currentPost = day.posts[p];
              const pId = currentPost.id || `post_${d}_${p}`;
              if (pId === iId || (iId.startsWith("post_") && iId === `post_${d}_${p}`)) {
                found = {
                  ...currentPost,
                  id: pId,
                  theme: day.theme,
                  dayNumber: d + 1,
                  original_ref: currentPost,
                };
                break;
              }
            }
          }
          if (found) break;
        }
      } else if (Array.isArray(captions)) {
        for (let c = 0; c < captions.length; c++) {
          const currentCap = captions[c];
          const cId = currentCap.id || `cap_${c}`;
          if (cId === iId || (iId.startsWith("cap_") && iId === `cap_${c}`)) {
            found = {
              ...currentCap,
              id: cId,
              caption: currentCap.caption,
              tags: currentCap.tags,
              original_ref: currentCap,
            };
            break;
          }
        }
      } else if (Array.isArray(posts)) {
        for (let p = 0; p < posts.length; p++) {
          const currentPost = posts[p];
          const pId = currentPost.id || `post_${p}`;
          if (pId === iId || (iId.startsWith("post_") && iId === `post_${p}`)) {
            found = {
              ...currentPost,
              id: pId,
              original_ref: currentPost,
            };
            break;
          }
        }
      }

      if (!found) {
        throw new Error("Post item not found in this template");
      }

      setPost(found);
      setCaption(found.caption || "");
      setPrompt(found.generation_prompt || found.prompt || "");
      const formattedTags = Array.isArray(found.tags)
        ? found.tags.map((tg: string) => (tg.startsWith("#") ? tg : `#${tg}`)).join(" ")
        : typeof found.tags === "string"
        ? found.tags
        : "";
      setTags(formattedTags);
      setStatus(found.status || "pending");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tId = params.get("templateId");
    const iId = params.get("itemId");
    if (!tId || !iId) {
      setError("Missing templateId or itemId parameters");
      setIsLoading(false);
      return;
    }
    setTemplateId(tId);
    setItemId(iId);
    fetchPostDetail(tId, iId);
  }, []);

  const handleCopy = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyFullPost = () => {
    const text = [caption, tags].filter(Boolean).join("\n\n");
    handleCopy(text, "full-post");
  };

  const handleSave = async () => {
    if (!template || !post || !templateId) return;
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      // Mutate the original reference in template json_data
      if (post.original_ref) {
        post.original_ref.caption = caption;
        if (post.original_ref.generation_prompt !== undefined) {
          post.original_ref.generation_prompt = prompt;
        } else if (prompt) {
          post.original_ref.generation_prompt = prompt;
        }
        post.original_ref.status = status;
        post.original_ref.tags = tags
          .split(/[\s,]+/)
          .map((t) => t.trim())
          .filter(Boolean)
          .map((t) => (t.startsWith("#") ? t : `#${t}`));
      }

      const res = await fetch("/api/templates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: templateId,
          json_data: template.json_data,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save changes");
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: any) {
      console.error(err);
      alert("Error saving: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendToIntegration = () => {
    if (typeof window !== "undefined") {
      const fullText = [caption, tags].filter(Boolean).join("\n\n");
      localStorage.setItem("pending_facebook_post", fullText);
    }
    router.push("/facebook/integration");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FiRefreshCw className="w-8 h-8 text-slate-400 animate-spin" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="space-y-4 px-4 sm:px-0">
        <Link
          href={templateId ? `/facebook/content?id=${templateId}` : "/facebook/templates"}
          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
        >
          <FiArrowLeft /> Back to Facebook Plan
        </Link>
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-lg border border-red-200">
          <FiAlertCircle className="w-5 h-5" />
          <p>{error || "Post not found"}</p>
        </div>
      </div>
    );
  }

  const pageName = template?.json_data?.page_name || "Facebook Page";
  const postNumber = post.post_number ?? post.number ?? 1;

  return (
    <div className="space-y-6 mx-auto pb-12 sm:px-4 max-w-7xl">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href={`/facebook/content?id=${templateId}`}
            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline font-medium mb-1.5"
          >
            <FiArrowLeft /> Back to Facebook Plan
          </Link>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded border border-blue-200 uppercase">
              {pageName}
            </span>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded border border-slate-200">
              Post #{postNumber}
            </span>
            {post.time && (
              <span className="text-xs text-slate-500 font-medium">🕒 {post.time}</span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            {post.theme || `Post #${postNumber} Details`}
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleCopyFullPost}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            {copiedId === "full-post" ? (
              <>
                <FiCheck className="w-4 h-4 text-green-500" />
                <span className="text-green-600">Copied Full Post</span>
              </>
            ) : (
              <>
                <FiCopy className="w-4 h-4 text-blue-600" />
                <span>Copy Post</span>
              </>
            )}
          </button>

          <button
            onClick={handleSendToIntegration}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <FiShare2 className="w-4 h-4" />
            <span>Publish / Schedule</span>
          </button>
        </div>
      </div>

      {/* 2-Column Grid: Left Edit Form, Right Live Facebook Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Editor (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Caption Box */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <span>Post Caption</span>
                <span className="text-xs font-normal text-slate-400">
                  ({caption.length} characters • {caption.split(/\s+/).filter(Boolean).length} words)
                </span>
              </label>
              <button
                onClick={() => handleCopy(caption, "caption-only")}
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 font-medium px-2 py-0.5 rounded hover:bg-slate-100 transition-colors cursor-pointer"
              >
                {copiedId === "caption-only" ? (
                  <>
                    <FiCheck className="w-3.5 h-3.5 text-green-500" />
                    <span className="text-green-600">Copied</span>
                  </>
                ) : (
                  <>
                    <FiCopy className="w-3.5 h-3.5" />
                    <span>Copy Caption</span>
                  </>
                )}
              </button>
            </div>
            <textarea
              rows={6}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Enter Facebook post caption..."
              className="w-full p-3.5 text-sm text-slate-900 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none leading-relaxed resize-y"
            />
          </div>

          {/* Hashtags Box */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <FiTag className="w-4 h-4 text-slate-400" />
                <span>Hashtags</span>
              </label>
              <button
                onClick={() => handleCopy(tags, "tags-only")}
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 font-medium px-2 py-0.5 rounded hover:bg-slate-100 transition-colors cursor-pointer"
              >
                {copiedId === "tags-only" ? (
                  <>
                    <FiCheck className="w-3.5 h-3.5 text-green-500" />
                    <span className="text-green-600">Copied</span>
                  </>
                ) : (
                  <>
                    <FiCopy className="w-3.5 h-3.5" />
                    <span>Copy Tags</span>
                  </>
                )}
              </button>
            </div>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="#KarachiClothe #AutumnFashion #CambricCollection..."
              className="w-full px-3.5 py-2.5 text-sm text-slate-900 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
            />
            {/* Visual Tag Pills */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {tags
                .split(/[\s,]+/)
                .filter(Boolean)
                .map((tg, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded-full text-xs font-medium"
                  >
                    {tg.startsWith("#") ? tg : `#${tg}`}
                  </span>
                ))}
            </div>
          </div>

          {/* AI Image Generation Prompt Box */}
          {prompt && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <FiImage className="w-4 h-4 text-slate-400" />
                  <span>AI Image Generation Prompt</span>
                </label>
                <button
                  onClick={() => handleCopy(prompt, "prompt-only")}
                  className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 font-medium px-2 py-0.5 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  {copiedId === "prompt-only" ? (
                    <>
                      <FiCheck className="w-3.5 h-3.5 text-green-500" />
                      <span className="text-green-600">Copied</span>
                    </>
                  ) : (
                    <>
                      <FiCopy className="w-3.5 h-3.5" />
                      <span>Copy Prompt</span>
                    </>
                  )}
                </button>
              </div>
              <textarea
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="AI prompt for generating visuals..."
                className="w-full p-3 font-mono text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none leading-relaxed"
              />
            </div>
          )}

          {/* Status & Save Action */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Post Status:
              </span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={`text-xs font-semibold rounded-lg px-3 py-1.5 border transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  status === "published"
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : status === "completed"
                    ? "bg-green-50 text-green-700 border-green-200"
                    : status === "draft"
                    ? "bg-slate-100 text-slate-700 border-slate-300"
                    : "bg-amber-50 text-amber-800 border-amber-300"
                }`}
              >
                <option value="pending">Pending</option>
                <option value="draft">Draft</option>
                <option value="completed">Completed</option>
                <option value="published">Published</option>
              </select>
            </div>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-xs cursor-pointer ${
                saveSuccess
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-70"
              }`}
            >
              {isSaving ? (
                <>
                  <FiRefreshCw className="w-4 h-4 animate-spin" /> Saving...
                </>
              ) : saveSuccess ? (
                <>
                  <FiCheck className="w-4 h-4" /> Changes Saved!
                </>
              ) : (
                <>
                  <FiSave className="w-4 h-4" /> Save Post Changes
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Facebook Feed Mockup Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="sticky top-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Live Facebook Feed Preview
              </span>
              <span className="text-[11px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                Mockup
              </span>
            </div>

            {/* Facebook Card Mockup */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-md overflow-hidden">
              {/* Header */}
              <div className="p-4 flex items-center justify-between border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-base shadow-xs">
                    {pageName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-sm text-slate-900">{pageName}</span>
                      <span className="w-3.5 h-3.5 rounded-full bg-blue-600 text-white text-[9px] flex items-center justify-center font-bold">
                        ✓
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1">
                      <span>{post.time || "Just now"}</span>
                      <span>•</span>
                      <span>🌎 Public</span>
                    </div>
                  </div>
                </div>

                <div className="text-slate-400 text-lg cursor-pointer">•••</div>
              </div>

              {/* Caption Text */}
              <div className="p-4 space-y-2">
                <p className="text-sm text-slate-900 leading-relaxed whitespace-pre-wrap">
                  {caption || "Your post caption will appear here..."}
                </p>
                {tags && (
                  <p className="text-sm text-blue-600 font-medium leading-relaxed">
                    {tags}
                  </p>
                )}
              </div>

              {/* Image Visual Area */}
              <div className="bg-slate-100 border-y border-slate-200 aspect-video flex flex-col items-center justify-center p-6 text-center text-slate-400">
                {prompt ? (
                  <div className="space-y-2">
                    <FiImage className="w-8 h-8 mx-auto text-slate-400" />
                    <p className="text-xs text-slate-600 font-medium max-w-sm line-clamp-3">
                      {prompt}
                    </p>
                    <span className="inline-block text-[10px] uppercase font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      Visual Generator Prompt
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <FiImage className="w-8 h-8 mx-auto" />
                    <p className="text-xs font-medium">Post Visual / Image</p>
                  </div>
                )}
              </div>

              {/* Engagement Stats Mockup */}
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                    👍
                  </span>
                  <span className="w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px]">
                    ❤️
                  </span>
                  <span>142</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>18 Comments</span>
                  <span>•</span>
                  <span>9 Shares</span>
                </div>
              </div>

              {/* Action Buttons Mockup */}
              <div className="px-4 py-2 flex items-center justify-around text-slate-600 text-xs font-semibold">
                <button className="flex items-center gap-1.5 py-1 px-3 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
                  <FiThumbsUp className="w-4 h-4" />
                  <span>Like</span>
                </button>
                <button className="flex items-center gap-1.5 py-1 px-3 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
                  <FiMessageSquare className="w-4 h-4" />
                  <span>Comment</span>
                </button>
                <button className="flex items-center gap-1.5 py-1 px-3 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
                  <FiShare className="w-4 h-4" />
                  <span>Share</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
