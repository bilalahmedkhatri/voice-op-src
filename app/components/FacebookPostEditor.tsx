'use client';

import { useState, useRef, useEffect } from 'react';
import {
  FaImage,
  FaTimes,
  FaGlobeAmericas,
  FaThumbsUp,
  FaRegCommentAlt,
  FaShare,
  FaCheckCircle,
  FaExclamationCircle,
  FaInstagram,
  FaFacebook,
  FaClock,
  FaVideo,
  FaMobileAlt,
  FaDesktop,
  FaHashtag,
} from 'react-icons/fa';

interface FacebookPostEditorProps {
  pages: any[];
  onDisconnect: () => void;
  onPostCreated?: () => void;
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

  // Preview Mode
  const [previewMode, setPreviewMode] = useState<'mobile' | 'desktop'>('mobile');

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
        setPreviewMode('mobile');
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

    // Format local datetime for <input type="datetime-local">
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

      // Next.js Server-Side Proxy (Shielding backend URL & API keys)
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
    <div className="flex flex-col lg:flex-row gap-6 w-full max-w-[1240px] mx-auto min-h-[720px]">
      {/* LEFT PANE: Composer Workspace */}
      <div className="w-full lg:w-[50%] flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 bg-white sticky top-0 z-10 flex justify-between items-center">
          <div>
            <h2 className="text-base font-bold text-slate-900">Post & Reel Studio</h2>
            <p className="text-[11px] text-slate-500">Publish or schedule to Facebook and Instagram</p>
          </div>
          <button
            onClick={onDisconnect}
            className="text-xs font-semibold text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
          >
            Disconnect Page
          </button>
        </div>

        <div className="p-5 flex-1 overflow-y-auto space-y-5">
          {/* Status Alert */}
          {status && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 border ${
                status.type === 'success'
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

          {/* Destination Selector: Facebook & Instagram */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              1. Publishing Destinations
            </label>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
              {/* Facebook Page Select */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={postToFacebook}
                    onChange={(e) => setPostToFacebook(e.target.checked)}
                    className="w-4 h-4 accent-[#ff7d6e] rounded cursor-pointer"
                  />
                  <FaFacebook className="text-blue-600 text-base" />
                  <span>Facebook Page:</span>
                </label>
                <select
                  value={selectedPage?.page_id || selectedPage?.id || ''}
                  onChange={(e) => {
                    const pg = pages.find((p) => (p.page_id || p.id) === e.target.value);
                    if (pg) setSelectedPage(pg);
                  }}
                  className="px-2.5 py-1 text-xs font-semibold bg-white border border-slate-200 rounded-lg outline-none text-slate-700 cursor-pointer"
                >
                  {pages.map((p) => (
                    <option key={p.page_id || p.id} value={p.page_id || p.id}>
                      {p.page_name || p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Instagram Professional Option */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={postToInstagram}
                    onChange={(e) => setPostToInstagram(e.target.checked)}
                    disabled={!hasInstagram}
                    className="w-4 h-4 text-pink-600 rounded-sm focus:ring-pink-500 cursor-pointer disabled:cursor-not-allowed"
                  />
                  <FaInstagram className="text-pink-600 text-base" />
                  <span>Instagram Account:</span>
                </label>
                {hasInstagram ? (
                  <span className="text-xs font-bold text-pink-700 bg-pink-50 px-2 py-0.5 rounded-md border border-pink-200">
                    @{igUsername}
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400 italic">No linked IG business account</span>
                )}
              </div>
            </div>
          </div>

          {/* Format Selector Pills */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              2. Content Format
            </label>
            <div className="grid grid-cols-4 gap-2">
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
                    onClick={() => {
                      setPostType(fmt.id as any);
                      if (fmt.id === 'reel') setPreviewMode('mobile');
                      else setPreviewMode('desktop');
                    }}
                    className={`py-2 px-1.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-[#ff9b8f] to-[#ff7d6e] border-[#ff7d6e] text-white shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-orange-50/50 hover:border-[#ff9b8f]/60'
                    }`}
                  >
                    <Icon className="text-sm" />
                    <span>{fmt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Media Attachment */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                3. Media Attachment
              </label>
              <span className="text-[10px] text-slate-400">Reel: 9:16 vertical • Max 1GB</span>
            </div>

            {!mediaPreviewUrl ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-[#ff9b8f] rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-slate-50/50 hover:bg-orange-50/20 transition-all text-center"
              >
                <FaImage className="text-slate-400 text-xl" />
                <span className="text-xs font-bold text-slate-700">Upload video or photo</span>
                <span className="text-[11px] text-slate-400">Supports MP4, MOV, WEBM, PNG, JPG</span>
              </div>
            ) : (
              <div className="relative border border-slate-200 rounded-xl overflow-hidden bg-slate-900 p-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {mediaFile?.type?.startsWith('video/') || postType === 'reel' || postType === 'video' ? (
                    <video src={mediaPreviewUrl} className="h-14 w-14 object-cover rounded-lg" />
                  ) : (
                    <img src={mediaPreviewUrl} alt="Preview" className="h-14 w-14 object-cover rounded-lg" />
                  )}
                  <div>
                    <span className="text-xs font-bold text-white block truncate max-w-[200px]">
                      {mediaFile?.name || 'Attached Media Asset'}
                    </span>
                    <span className="text-[11px] text-slate-400">Ready for publishing</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeMedia}
                  className="px-2.5 py-1 bg-rose-500/80 hover:bg-rose-600 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Remove
                </button>
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

          {/* Caption & Hashtags */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                4. Caption & Details
              </label>
              <span className="text-[11px] text-slate-400">
                {message.length} / {maxChars}
              </span>
            </div>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write a viral caption, hook, or status update..."
              className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#ff9b8f]/25 focus:border-[#ff9b8f] transition-all resize-none h-28"
              maxLength={maxChars}
            />

            {/* Quick Hashtag Chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mr-1">
                <FaHashtag className="text-[10px]" /> Tags:
              </span>
              {['#VoiceAI', '#Reels', '#Shorts', '#Trending', '#AI', '#Viral'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => addHashtag(tag)}
                  className="text-[10px] font-semibold px-2 py-0.5 bg-orange-50 hover:bg-orange-100 text-orange-950 border border-orange-200/80 rounded-md transition-colors cursor-pointer"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Scheduling Section with 10m-75d constraints */}
          <div className="space-y-2.5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isScheduled}
                  onChange={(e) => setIsScheduled(e.target.checked)}
                  className="w-4 h-4 accent-[#ff7d6e] rounded cursor-pointer"
                />
                <FaClock className="text-[#ff7d6e] text-xs" />
                <span>Schedule for Later</span>
              </label>
              <span className="text-[10px] text-slate-400 font-medium">Meta Limit: 10m - 75 days</span>
            </div>

            {isScheduled && (
              <div className="space-y-2 pt-2 border-t border-slate-200/70">
                <div className="flex items-center gap-2">
                  <input
                    type="datetime-local"
                    value={scheduleTime}
                    min={minScheduleDate}
                    max={maxScheduleDate}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="flex-1 p-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold outline-none focus:ring-2 focus:ring-[#ff9b8f]/25 focus:border-[#ff9b8f]"
                    required={isScheduled}
                  />
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-slate-400 font-semibold">Quick Presets:</span>
                  <button
                    type="button"
                    onClick={() => applyPresetTime('30m')}
                    className="px-2 py-0.5 bg-white border border-slate-200 hover:bg-orange-50/50 hover:text-[#c83a2a] hover:border-[#ff9b8f]/60 text-slate-600 rounded-md text-[10px] font-bold transition-all cursor-pointer shadow-2xs"
                  >
                    +35 Mins
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetTime('tomorrow_9am')}
                    className="px-2 py-0.5 bg-white border border-slate-200 hover:bg-orange-50/50 hover:text-[#c83a2a] hover:border-[#ff9b8f]/60 text-slate-600 rounded-md text-[10px] font-bold transition-all cursor-pointer shadow-2xs"
                  >
                    Tomorrow 9 AM
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetTime('tomorrow_6pm')}
                    className="px-2 py-0.5 bg-white border border-slate-200 hover:bg-orange-50/50 hover:text-[#c83a2a] hover:border-[#ff9b8f]/60 text-slate-600 rounded-md text-[10px] font-bold transition-all cursor-pointer shadow-2xs"
                  >
                    Tomorrow 6 PM (Best)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
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
              <span>Submitting to Meta...</span>
            ) : isScheduled ? (
              <span>Schedule Post</span>
            ) : (
              <span>Publish Now</span>
            )}
          </button>
        </div>
      </div>

      {/* RIGHT PANE: Live Interactive Preview */}
      <div className="w-full lg:w-[50%] flex flex-col bg-slate-100/60 rounded-2xl overflow-hidden border border-slate-200 shadow-xs">
        {/* Preview Header with Switcher */}
        <div className="p-3.5 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800">Live Preview:</span>
            <span className="text-[11px] text-slate-500">
              {previewMode === 'mobile' ? 'Mobile Reel (9:16)' : 'Desktop Feed'}
            </span>
          </div>

          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setPreviewMode('mobile')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                previewMode === 'mobile'
                  ? 'bg-gradient-to-r from-[#ff9b8f] to-[#ff7d6e] text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <FaMobileAlt /> Reel
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode('desktop')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                previewMode === 'desktop'
                  ? 'bg-gradient-to-r from-[#ff9b8f] to-[#ff7d6e] text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <FaDesktop /> Feed
            </button>
          </div>
        </div>

        {/* Preview Container */}
        <div className="flex-1 p-4 sm:p-6 flex items-center justify-center overflow-y-auto">
          {previewMode === 'mobile' ? (
            /* 9:16 VERTICAL REEL PREVIEW PHONE SIMULATOR */
            <div className="w-[300px] h-[550px] bg-black rounded-[36px] border-4 border-slate-800 shadow-2xl relative overflow-hidden flex flex-col justify-between text-white">
              {/* Phone Camera Notch */}
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-24 h-4 bg-slate-800 rounded-full z-20" />

              {/* Video or Background Media */}
              {mediaPreviewUrl ? (
                mediaFile?.type?.startsWith('video/') || postType === 'reel' || postType === 'video' ? (
                  <video
                    src={mediaPreviewUrl}
                    className="absolute inset-0 w-full h-full object-cover z-0"
                    controls
                    loop
                  />
                ) : (
                  <img
                    src={mediaPreviewUrl}
                    alt="Reel Media"
                    className="absolute inset-0 w-full h-full object-cover z-0"
                  />
                )
              ) : (
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-black flex flex-col items-center justify-center p-6 text-center z-0">
                  <FaVideo className="text-3xl text-slate-600 mb-2" />
                  <span className="text-xs font-bold text-slate-400">9:16 Video Asset</span>
                  <span className="text-[10px] text-slate-500 mt-1">Upload a vertical video to preview your Reel</span>
                </div>
              )}

              {/* Gradient Dark Overlay for Text Legibility */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 pointer-events-none z-10" />

              {/* Top Bar inside Phone */}
              <div className="relative z-20 pt-7 px-4 flex items-center justify-between text-xs font-bold">
                <span className="bg-black/40 px-2 py-0.5 rounded-full text-[10px]">Reels</span>
                <span className="text-[10px] text-white/80">{isScheduled ? 'Scheduled' : 'Live'}</span>
              </div>

              {/* Floating Right Actions (Like, Comment, Share) */}
              <div className="relative z-20 self-end mr-3 mb-16 flex flex-col items-center gap-3">
                <div className="flex flex-col items-center gap-0.5">
                  <div className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-xs flex items-center justify-center text-sm">
                    <FaThumbsUp />
                  </div>
                  <span className="text-[9px] font-bold">12.4K</span>
                </div>

                <div className="flex flex-col items-center gap-0.5">
                  <div className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-xs flex items-center justify-center text-sm">
                    <FaRegCommentAlt />
                  </div>
                  <span className="text-[9px] font-bold">382</span>
                </div>

                <div className="flex flex-col items-center gap-0.5">
                  <div className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-xs flex items-center justify-center text-sm">
                    <FaShare />
                  </div>
                  <span className="text-[9px] font-bold">Share</span>
                </div>
              </div>

              {/* Bottom Details Overlay */}
              <div className="relative z-20 p-4 pb-6 space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold border border-white">
                    {pageName.charAt(0)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold drop-shadow-sm">{pageName}</span>
                    {postToInstagram && hasInstagram && (
                      <span className="text-[10px] text-pink-300 drop-shadow-sm">@{igUsername}</span>
                    )}
                  </div>
                </div>

                <p className="text-[11px] leading-relaxed line-clamp-3 text-white/90 drop-shadow-sm">
                  {message || 'Your Reel hook and caption will appear here...'}
                </p>

                <div className="flex items-center gap-1 text-[10px] text-white/70">
                  <span>🎵 Original Audio - {pageName}</span>
                </div>
              </div>
            </div>
          ) : (
            /* DESKTOP FACEBOOK FEED CARD PREVIEW */
            <div className="w-full max-w-[460px] bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden text-slate-800">
              <div className="p-3 flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                  {pageName.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-900">{pageName}</div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <span>{isScheduled ? 'Scheduled' : 'Just now'}</span>
                    <span>•</span>
                    <FaGlobeAmericas className="text-[10px]" />
                  </div>
                </div>
              </div>

              {message && (
                <div className="px-3 pb-2.5 text-xs text-slate-800 whitespace-pre-wrap">{message}</div>
              )}

              {mediaPreviewUrl ? (
                <div className="w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
                  {mediaFile?.type?.startsWith('video/') || postType === 'video' || postType === 'reel' ? (
                    <video src={mediaPreviewUrl} className="w-full h-full object-contain" controls />
                  ) : (
                    <img src={mediaPreviewUrl} alt="Post preview" className="w-full h-full object-cover" />
                  )}
                </div>
              ) : (
                <div className="w-full aspect-video bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                  Photo or video attachment
                </div>
              )}

              <div className="p-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold">
                <div className="flex-1 py-1 flex items-center justify-center gap-1.5 hover:bg-slate-50 rounded cursor-pointer">
                  <FaThumbsUp /> Like
                </div>
                <div className="flex-1 py-1 flex items-center justify-center gap-1.5 hover:bg-slate-50 rounded cursor-pointer">
                  <FaRegCommentAlt /> Comment
                </div>
                <div className="flex-1 py-1 flex items-center justify-center gap-1.5 hover:bg-slate-50 rounded cursor-pointer">
                  <FaShare /> Share
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
