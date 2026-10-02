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
} from "react-icons/fi";
import { Button } from "@/components/ui";

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
          className="inline-flex items-center gap-2 text-sm text-[#c83a2a] hover:underline font-medium"
        >
          <FiArrowLeft /> Back to Facebook Plan
        </Link>
        <div className="flex items-center gap-2 p-4 bg-rose-50 text-rose-700 rounded-xl border border-rose-200">
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
            className="inline-flex items-center gap-2 text-sm text-[#c83a2a] hover:underline font-medium mb-1.5"
          >
            <FiArrowLeft /> Back to Facebook Plan
          </Link>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-orange-50 text-[#c83a2a] text-xs font-bold rounded-lg border border-orange-200/80 uppercase">
              {pageName}
            </span>
            <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200">
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
          <Button
            size="md"
            variant="secondary"
            onClick={handleCopyFullPost}
            icon={copiedId === "full-post" ? <FiCheck className="w-4 h-4 text-emerald-500" /> : <FiCopy className="w-4 h-4 text-[#ff7d6e]" />}
            hideTextOnMobile={true}
          >
            {copiedId === "full-post" ? "Copied Full Post" : "Copy Post"}
          </Button>

          <Button
            size="md"
            variant="primary"
            onClick={handleSendToIntegration}
            icon={<FiShare2 className="w-4 h-4" />}
            hideTextOnMobile={true}
          >
            Publish / Schedule
          </Button>
        </div>
      </div>

      {/* Post Editor Container */}
      <div className="mx-auto space-y-5">
        {/* Caption Box */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <span>Post Caption</span>
              <span className="text-xs font-normal text-slate-400">
                ({caption.length} characters • {caption.split(/\s+/).filter(Boolean).length} words)
              </span>
            </label>
            <button
              onClick={() => handleCopy(caption, "caption-only")}
              className="inline-flex items-center justify-center gap-1 text-xs text-slate-500 hover:text-[#c83a2a] font-medium px-2 py-0.5 rounded hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {copiedId === "caption-only" ? (
                <>
                  <FiCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600 font-semibold">Copied</span>
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
            className="w-full p-3.5 text-sm text-slate-900 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#ff9b8f]/25 focus:border-[#ff9b8f] focus:outline-none leading-relaxed resize-y"
          />
        </div>

        {/* Hashtags Box */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <FiTag className="w-4 h-4 text-slate-400" />
              <span>Hashtags</span>
            </label>
            <button
              onClick={() => handleCopy(tags, "tags-only")}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-[#c83a2a] font-medium px-2 py-0.5 rounded hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {copiedId === "tags-only" ? (
                <>
                  <FiCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600 font-semibold">Copied</span>
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
            className="w-full px-3.5 py-2.5 text-sm text-slate-900 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#ff9b8f]/25 focus:border-[#ff9b8f] focus:outline-none font-medium"
          />
          {/* Visual Tag Pills */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {tags
              .split(/[\s,]+/)
              .filter(Boolean)
              .map((tg, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-0.5 bg-orange-50 text-orange-900 border border-orange-200/80 rounded-full text-xs font-medium"
                >
                  {tg.startsWith("#") ? tg : `#${tg}`}
                </span>
              ))}
          </div>
        </div>

        {/* AI Image Generation Prompt Box */}
        {prompt && (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <FiImage className="w-4 h-4 text-[#ff7d6e]" />
                <span>AI Image Generation Prompt</span>
              </label>
              <button
                onClick={() => handleCopy(prompt, "prompt-only")}
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-[#c83a2a] font-medium px-2 py-0.5 rounded-lg hover:bg-orange-50/50 transition-colors cursor-pointer"
              >
                {copiedId === "prompt-only" ? (
                  <>
                    <FiCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-600">Copied</span>
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
              className="w-full p-3 font-mono text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#ff9b8f]/25 focus:border-[#ff9b8f] focus:outline-none leading-relaxed transition-all"
            />
          </div>
        )}

        {/* Status & Save Action */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Post Status:
            </span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={`text-xs font-semibold rounded-xl px-3 py-1.5 border transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#ff9b8f]/25 focus:border-[#ff9b8f] ${status === "published"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : status === "completed"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : status === "draft"
                    ? "bg-slate-100 text-slate-700 border-slate-200"
                    : "bg-amber-50 text-amber-800 border-amber-300"
                }`}
            >
              <option value="pending">Pending</option>
              <option value="draft">Draft</option>
              <option value="completed">Completed</option>
              <option value="published">Published</option>
            </select>
          </div>

          <Button
            onClick={handleSave}
            disabled={isSaving}
            isLoading={isSaving}
            size="md"
            variant="primary"
            className={saveSuccess ? "!bg-emerald-600 hover:!bg-emerald-700 text-white" : ""}
            icon={saveSuccess ? <FiCheck className="w-4 h-4" /> : <FiSave className="w-4 h-4" />}
          >
            {saveSuccess ? "Changes Saved!" : "Save Post Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
