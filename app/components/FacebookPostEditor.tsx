'use client';

import { useState, useRef, useEffect } from 'react';
import {
  FaImage,
  FaTimes,
  FaGlobeAmericas,
  FaCheckCircle,
  FaExclamationCircle,
  FaInstagram,
  FaFacebook,
  FaClock,
  FaVideo,
  FaMobileAlt,
  FaHashtag,
  FaPaperPlane,
} from 'react-icons/fa';

interface FacebookPostEditorProps {
  pages: any[];
  onDisconnect: () => void;
  onPostCreated?: () => void;
  onResyncPages?: () => void;
  initialData?: {
    title?: string;
    caption?: string;
    mediaUrl?: string;
    type?: string;
    templateId?: string;
    itemId?: string;
  } | null;
}

export default function FacebookPostEditor({
  pages,
  onDisconnect,
  onPostCreated,
  onResyncPages,
  initialData,
}: FacebookPostEditorProps) {
  const [selectedPage, setSelectedPage] = useState<any>(pages.length > 0 ? pages[0] : null);

  // Destinations: Facebook and/or Instagram
  const [postToFacebook, setPostToFacebook] = useState(true);
  const [postToInstagram, setPostToInstagram] = useState(false);

  // Post Type: 'reel' | 'post' | 'photo' | 'video'
  const [postType, setPostType] = useState<'reel' | 'post' | 'photo' | 'video'>('reel');

  const [message, setMessage] = useState(initialData?.caption || '');
  const [title, setTitle] = useState(initialData?.title || '');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(initialData?.mediaUrl || null);

  const [buttonType, setButtonType] = useState('');
  const [buttonLink, setButtonLink] = useState('');

  // Scheduling states
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleTime, setScheduleTime] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const maxChars = 2200;

  // Sync selected page when pages prop changes
  useEffect(() => {
    if (pages.length > 0 && !selectedPage) {
      setSelectedPage(pages[0]);
    }
  }, [pages, selectedPage]);

  // Load initialData if provided or updated
  useEffect(() => {
    if (initialData) {
      if (initialData.caption) setMessage(initialData.caption);
      if (initialData.title) setTitle(initialData.title);
      if (initialData.mediaUrl) setMediaPreviewUrl(initialData.mediaUrl);
      if (initialData.type === 'short' || initialData.type === 'reel') {
        setPostType('reel');
      }
    }
  }, [initialData]);

  // Bounds for scheduling: min = Now + 10 mins, max = Now + 75 days
  const now = new Date();
  const minScheduleDate = new Date(now.getTime() + 10 * 60 * 1000).toISOString().slice(0, 16);
  const maxScheduleDate = new Date(now.getTime() + 75 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setMediaFile(file);

      const objectUrl = URL.createObjectURL(file);
      setMediaPreviewUrl(objectUrl);

      if (file.type.startsWith('video/')) {
        setPostType('reel');
      } else if (file.type.startsWith('image/')) {
        setPostType('photo');
      }
    }
  };

  const removeMedia = () => {
    setMediaFile(null);
    if (mediaPreviewUrl && mediaPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(mediaPreviewUrl);
    }
    setMediaPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const applyPresetTime = (preset: '30m' | 'tomorrow_9am' | 'tomorrow_6pm') => {
    const target = new Date();
    if (preset === '30m') {
      target.setMinutes(target.getMinutes() + 35);
    } else if (preset === 'tomorrow_9am') {
      target.setDate(target.getDate() + 1);
      target.setHours(9, 0, 0, 0);
    } else if (preset === 'tomorrow_6pm') {
      target.setDate(target.getDate() + 1);
      target.setHours(18, 0, 0, 0);
    }

    const year = target.getFullYear();
    const month = String(target.getMonth() + 1).padStart(2, '0');
    const day = String(target.getDate()).padStart(2, '0');
    const hours = String(target.getHours()).padStart(2, '0');
    const minutes = String(target.getMinutes()).padStart(2, '0');

    setScheduleTime(`${year}-${month}-${day}T${hours}:${minutes}`);
    setIsScheduled(true);
  };

  const addHashtag = (tag: string) => {
    if (!message.includes(tag)) {
      setMessage((prev) => (prev ? `${prev} ${tag}` : tag));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPage) return;
    if (!message.trim() && !mediaFile && !mediaPreviewUrl) {
      setStatus({ type: 'error', text: 'Please add a message or media file.' });
      return;
    }

    setIsSubmitting(true);
    setStatus(null);

    let scheduled_publish_time: number | null = null;
    if (isScheduled && scheduleTime) {
      scheduled_publish_time = Math.floor(new Date(scheduleTime).getTime() / 1000);
      const currentEpoch = Math.floor(Date.now() / 1000);

      if (scheduled_publish_time < currentEpoch + 600) {
        setStatus({
          type: 'error',
          text: 'Meta requires scheduled publish time to be at least 10 minutes in the future.',
        });
        setIsSubmitting(false);
        return;
      }

      if (scheduled_publish_time > currentEpoch + 75 * 24 * 3600) {
        setStatus({
          type: 'error',
          text: 'Meta allows scheduling up to 75 days in advance.',
        });
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const formData = new FormData();
      formData.append('page_id', selectedPage.page_id || selectedPage.id);
      formData.append('message', message);
      formData.append('post_type', postType);

      const destination =
        postToFacebook && postToInstagram
          ? 'both'
          : postToInstagram
            ? 'instagram'
            : 'facebook';
      formData.append('destination', destination);

      if (title) formData.append('title', title);
      if (mediaFile) {
        formData.append('media', mediaFile);
      }
      if (buttonType) {
        formData.append('button_type', buttonType);
      }
      if (buttonLink) {
        formData.append('button_link', buttonLink);
      }
      if (scheduled_publish_time) {
        formData.append('scheduled_publish_time', scheduled_publish_time.toString());
      }
      if (initialData?.templateId) {
        formData.append('template_id', initialData.templateId);
      }
      if (initialData?.itemId) {
        formData.append('content_item_id', initialData.itemId);
      }

      const res = await fetch('/api/facebook/post-pages', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.status === 'success') {
        setStatus({
          type: 'success',
          text: scheduled_publish_time
            ? `Post scheduled successfully! ID: ${data.post_id || 'Queued'}`
            : `Post published successfully! ID: ${data.post_id || 'Live'}`,
        });
        setMessage('');
        setTitle('');
        removeMedia();
        setScheduleTime('');
        setIsScheduled(false);
        setButtonType('');
        setButtonLink('');

        if (onPostCreated) {
          onPostCreated();
        }
      } else {
        setStatus({
          type: 'error',
          text: data.error || 'Failed to publish post to Meta Graph API.',
        });
      }
    } catch (err: any) {
      console.error(err);
      setStatus({ type: 'error', text: 'A network error occurred while communicating with the server.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const pageName = selectedPage?.page_name || selectedPage?.name || 'Selected Page';
  const hasInstagram = Boolean(selectedPage?.instagram_business_account_id);
  const igUsername = selectedPage?.instagram_username || 'instagram_account';

  return (
    <div className="w-full mx-auto bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
      {/* Studio Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>Post & Reel Studio</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Publish or schedule directly to your connected Facebook Page and Instagram Account
          </p>
        </div>
        <div className="flex items-center gap-3">
          {onResyncPages && (
            <button
              type="button"
              onClick={onResyncPages}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
            >
              + Sync / Add Pages
            </button>
          )}
          <button
            onClick={onDisconnect}
            className="text-xs font-semibold text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
          >
            Disconnect
          </button>
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-6">
        {/* Status Alert */}
        {status && (
          <div
            className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 border ${status.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-red-50 text-red-800 border-red-200'
              }`}
          >
            {status.type === 'success' ? (
              <FaCheckCircle className="text-emerald-500 text-sm shrink-0 mt-0.5" />
            ) : (
              <FaExclamationCircle className="text-red-500 text-sm shrink-0 mt-0.5" />
            )}
            <span className="font-medium">{status.text}</span>
          </div>
        )}

        {/* Top 2-Column Controls: Destinations & Content Format */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* 1. Publishing Destinations */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              1. Publishing Destinations
            </label>
            <div className="p-3.5 bg-slate-50/80 border border-slate-200/90 rounded-xl space-y-3 min-h-[110px] flex flex-col justify-center">
              {/* Facebook Page Select */}
              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={postToFacebook}
                    onChange={(e) => setPostToFacebook(e.target.checked)}
                    className="w-4 h-4 accent-[#ff7d6e] rounded cursor-pointer"
                  />
                  <FaFacebook className="text-blue-600 text-base shrink-0" />
                  <span>Facebook Page:</span>
                </label>
                <select
                  value={selectedPage?.page_id || selectedPage?.id || ''}
                  onChange={(e) => {
                    const pg = pages.find((p) => (p.page_id || p.id) === e.target.value);
                    if (pg) setSelectedPage(pg);
                  }}
                  className="px-2.5 py-1 text-xs font-semibold bg-white border border-slate-200 rounded-lg outline-none text-slate-700 cursor-pointer max-w-[200px] truncate"
                >
                  {pages.map((p) => (
                    <option key={p.page_id || p.id} value={p.page_id || p.id}>
                      {p.page_name || p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Instagram Option */}
              <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-slate-200/70">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={postToInstagram}
                    onChange={(e) => setPostToInstagram(e.target.checked)}
                    disabled={!hasInstagram}
                    className="w-4 h-4 text-pink-600 rounded-sm focus:ring-pink-500 cursor-pointer disabled:cursor-not-allowed"
                  />
                  <FaInstagram className="text-pink-600 text-base shrink-0" />
                  <span>Instagram Account:</span>
                </label>
                {hasInstagram ? (
                  <span className="text-xs font-bold text-pink-700 bg-pink-50 px-2.5 py-0.5 rounded-md border border-pink-200">
                    @{igUsername}
                  </span>
                ) : (
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block font-medium">No linked IG business account</span>
                    <span className="text-[10px] text-slate-400">
                      (Link via Page Settings ➔ Linked Accounts)
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 2. Content Format */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              2. Content Format
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-2 lg:grid-cols-4 gap-2.5 min-h-[110px] items-stretch">
              {[
                { id: 'reel', label: 'Reel (9:16)', icon: FaMobileAlt },
                { id: 'post', label: 'Status', icon: FaGlobeAmericas },
                { id: 'photo', label: 'Photo', icon: FaImage },
                { id: 'video', label: 'Video', icon: FaVideo },
              ].map((fmt) => {
                const Icon = fmt.icon;
                const isActive = postType === fmt.id;
                return (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => setPostType(fmt.id as any)}
                    className={`py-3 px-2 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${isActive
                        ? 'bg-gradient-to-r from-[#ff9b8f] to-[#ff7d6e] border-[#ff7d6e] text-white shadow-xs'
                        : 'bg-slate-50/80 border-slate-200 text-slate-600 hover:bg-orange-50/50 hover:border-[#ff9b8f]/60'
                      }`}
                  >
                    <Icon className="text-base" />
                    <span>{fmt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3. Media Attachment */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              3. Media Attachment
            </label>
            <span className="text-[11px] text-slate-400">Reel: 9:16 vertical • Video & Photo up to 1GB</span>
          </div>

          {!mediaPreviewUrl ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 hover:border-[#ff9b8f] rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer bg-slate-50/50 hover:bg-orange-50/20 transition-all text-center group"
            >
              <div className="w-12 h-12 rounded-full bg-slate-100 group-hover:bg-orange-100/60 flex items-center justify-center transition-colors">
                <FaImage className="text-slate-400 group-hover:text-[#ff7d6e] text-xl transition-colors" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 block">Click to upload video or photo</span>
                <span className="text-[11px] text-slate-400">Supports MP4, MOV, WEBM, PNG, JPG (Vertical 9:16 recommended for Reels)</span>
              </div>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-900 p-3.5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 w-full sm:w-auto">
                <div className="relative h-20 w-20 shrink-0 bg-black rounded-xl overflow-hidden flex items-center justify-center border border-white/10">
                  {mediaFile?.type?.startsWith('video/') || postType === 'reel' || postType === 'video' ? (
                    <video src={mediaPreviewUrl} className="h-full w-full object-cover" />
                  ) : (
                    <img src={mediaPreviewUrl} alt="Preview" className="h-full w-full object-cover" />
                  )}
                  {mediaFile?.type?.startsWith('video/') || postType === 'reel' || postType === 'video' ? (
                    <span className="absolute bottom-1 right-1 bg-black/70 px-1 py-0.5 rounded text-[9px] font-bold text-white">
                      VIDEO
                    </span>
                  ) : (
                    <span className="absolute bottom-1 right-1 bg-black/70 px-1 py-0.5 rounded text-[9px] font-bold text-white">
                      PHOTO
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-white block truncate max-w-xs sm:max-w-md">
                    {mediaFile?.name || 'Attached Media Asset'}
                  </span>
                  <span className="text-[11px] text-emerald-400 font-medium block mt-0.5">
                    Ready for publishing ({postType.toUpperCase()})
                  </span>
                  {mediaFile?.size && (
                    <span className="text-[10px] text-slate-400">
                      {(mediaFile.size / (1024 * 1024)).toFixed(1)} MB
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Change
                </button>
                <button
                  type="button"
                  onClick={removeMedia}
                  className="px-3 py-1.5 bg-rose-500/90 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Remove
                </button>
              </div>
            </div>
          )}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*,video/*"
            onChange={handleMediaChange}
          />
        </div>

        {/* 4. Caption & Details */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              4. Caption & Details
            </label>
            <span className="text-[11px] text-slate-400 font-medium">
              {message.length} / {maxChars}
            </span>
          </div>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write a viral caption, hook, or status update..."
            className="w-full p-3.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#ff9b8f]/25 focus:border-[#ff9b8f] transition-all resize-none h-32 leading-relaxed"
            maxLength={maxChars}
          />

          {/* Quick Hashtag Chips */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mr-1">
              <FaHashtag className="text-[10px]" /> Tags:
            </span>
            {['#VoiceAI', '#Reels', '#Shorts', '#Trending', '#AI', '#Viral'].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => addHashtag(tag)}
                className="text-[11px] font-semibold px-2.5 py-1 bg-orange-50 hover:bg-orange-100 text-orange-950 border border-orange-200/80 rounded-lg transition-colors cursor-pointer"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* 5. Scheduling Options */}
        <div className="p-4 bg-slate-50/80 border border-slate-200/90 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isScheduled}
                onChange={(e) => setIsScheduled(e.target.checked)}
                className="w-4 h-4 accent-[#ff7d6e] rounded cursor-pointer"
              />
              <FaClock className="text-[#ff7d6e] text-sm" />
              <span>Schedule for Later</span>
            </label>
            <span className="text-[11px] text-slate-400 font-medium">Meta Limit: 10m - 75 days in advance</span>
          </div>

          {isScheduled && (
            <div className="space-y-3 pt-2.5 border-t border-slate-200/80">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <input
                  type="datetime-local"
                  value={scheduleTime}
                  min={minScheduleDate}
                  max={maxScheduleDate}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold outline-none focus:ring-2 focus:ring-[#ff9b8f]/25 focus:border-[#ff9b8f]"
                  required={isScheduled}
                />
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] text-slate-400 font-semibold">Quick Presets:</span>
                <button
                  type="button"
                  onClick={() => applyPresetTime('30m')}
                  className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-orange-50/50 hover:text-[#c83a2a] hover:border-[#ff9b8f]/60 text-slate-700 rounded-lg text-[11px] font-bold transition-all cursor-pointer shadow-2xs"
                >
                  +35 Mins
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetTime('tomorrow_9am')}
                  className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-orange-50/50 hover:text-[#c83a2a] hover:border-[#ff9b8f]/60 text-slate-700 rounded-lg text-[11px] font-bold transition-all cursor-pointer shadow-2xs"
                >
                  Tomorrow 9 AM
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetTime('tomorrow_6pm')}
                  className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-orange-50/50 hover:text-[#c83a2a] hover:border-[#ff9b8f]/60 text-slate-700 rounded-lg text-[11px] font-bold transition-all cursor-pointer shadow-2xs"
                >
                  Tomorrow 6 PM (Best Time)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            setMessage('');
            removeMedia();
            setScheduleTime('');
            setIsScheduled(false);
          }}
          className="px-4 py-2 bg-white border border-slate-200 hover:bg-orange-50/50 hover:border-[#ff9b8f]/60 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
        >
          Clear Form
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || (!message.trim() && !mediaFile && !mediaPreviewUrl)}
          className="px-6 py-2.5 bg-gradient-to-r from-[#ff9b8f] to-[#ff7d6e] hover:from-[#f8887a] hover:to-[#f05a48] text-white rounded-xl text-xs font-bold transition-all shadow-xs hover:shadow-md disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
        >
          {isSubmitting ? (
            <span>Publishing to Meta...</span>
          ) : isScheduled ? (
            <>
              <FaClock className="text-xs" />
              <span>Schedule Post</span>
            </>
          ) : (
            <>
              <FaPaperPlane className="text-xs" />
              <span>Publish Now</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
