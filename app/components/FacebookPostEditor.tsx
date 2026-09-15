'use client';

import { useState, useRef } from 'react';
import { 
  FaImage, 
  FaTimes, 
  FaGlobeAmericas, 
  FaThumbsUp, 
  FaRegCommentAlt, 
  FaShare,
  FaCheckCircle,
  FaExclamationCircle
} from 'react-icons/fa';

interface FacebookPostEditorProps {
  pages: any[];
  onDisconnect: () => void;
}

export default function FacebookPostEditor({ pages, onDisconnect }: FacebookPostEditorProps) {
  const [selectedPage, setSelectedPage] = useState<any>(pages.length > 0 ? pages[0] : null);
  
  const [message, setMessage] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null);
  
  const [buttonType, setButtonType] = useState('');
  const [buttonLink, setButtonLink] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const maxChars = 2200;

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setMediaFile(file);
      
      // Create object URL for preview
      const objectUrl = URL.createObjectURL(file);
      setMediaPreviewUrl(objectUrl);
    }
  };

  const removeMedia = () => {
    setMediaFile(null);
    if (mediaPreviewUrl) {
      URL.revokeObjectURL(mediaPreviewUrl);
      setMediaPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPage) return;
    if (!message.trim() && !mediaFile) return;

    setIsSubmitting(true);
    setStatus(null);

    let scheduled_publish_time = null;
    if (scheduleTime) {
      scheduled_publish_time = Math.floor(new Date(scheduleTime).getTime() / 1000);
      const now = Math.floor(Date.now() / 1000);
      if (scheduled_publish_time < now + 600) {
        setStatus({ type: 'error', text: 'Scheduled time must be at least 10 minutes in the future.' });
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      
      // 1. Store the token for the currently selected page first
      const tokenRes = await fetch(`${apiUrl}/api/v1/facebook/store-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page_id: selectedPage.id,
          page_name: selectedPage.name,
          access_token: selectedPage.access_token
        })
      });

      if (!tokenRes.ok) {
        const errorData = await tokenRes.json();
        setStatus({ type: 'error', text: errorData.detail || 'Failed to authenticate page with server.' });
        setIsSubmitting(false);
        return;
      }

      // 2. Post the data
      const formData = new FormData();
      formData.append('page_id', selectedPage.id);
      formData.append('message', message);
      
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

      const res = await fetch(`${apiUrl}/api/v1/facebook/post-pages`, {
        method: 'POST',
        // Omit Content-Type to allow the browser to set it automatically with the boundary for FormData
        body: formData
      });

      const data = await res.json();

      if (res.ok && data.status === 'success') {
        setStatus({ type: 'success', text: scheduled_publish_time ? 'Post scheduled successfully!' : 'Post published successfully!' });
        setMessage('');
        removeMedia();
        setScheduleTime('');
        setButtonType('');
        setButtonLink('');
      } else {
        setStatus({ type: 'error', text: data.detail || data.error?.message || 'Failed to publish post.' });
      }
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', text: 'A network error occurred while posting.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Placeholder Profile Pic (First letter of Page Name)
  const pageName = selectedPage?.name || 'Page';
  const profileInitial = pageName.charAt(0).toUpperCase();

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full max-w-[1200px] mx-auto bg-gray-50/50 min-h-[700px]">
      
      {/* LEFT PANE: Input Section */}
      <div className="w-full lg:w-[45%] flex flex-col bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm h-full">
        <div className="p-4 border-b border-gray-200 bg-white sticky top-0 z-10 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800">Create post</h2>
          <button onClick={onDisconnect} className="text-sm font-semibold text-gray-500 hover:text-red-500">
            Disconnect Page
          </button>
        </div>

        <div className="p-5 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-6">
          
          {/* Status Message */}
          {status && (
            <div className={`p-4 rounded-xl text-sm flex items-start gap-3 border ${
              status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
            }`}>
              {status.type === 'success' ? <FaCheckCircle className="text-emerald-500 text-lg shrink-0 mt-0.5" /> : <FaExclamationCircle className="text-red-500 text-lg shrink-0 mt-0.5" />}
              <span>{status.text}</span>
            </div>
          )}

          {/* Post To */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-800">Post to</label>
            <div className="flex items-center gap-3 p-2 border border-gray-300 rounded-lg bg-gray-50">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
                {profileInitial}
              </div>
              <select 
                value={selectedPage?.id || ''}
                onChange={(e) => {
                  const pg = pages.find(p => p.id === e.target.value);
                  if (pg) setSelectedPage(pg);
                }}
                className="flex-1 bg-transparent border-none outline-none font-medium text-gray-800 text-sm cursor-pointer"
              >
                {pages.map((page) => (
                  <option key={page.id} value={page.id}>{page.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Media */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-800">Media</label>
            <p className="text-xs text-gray-500">Share photos or videos.</p>
            
            {!mediaFile ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="mt-1 border border-gray-300 rounded-lg p-3 flex items-center justify-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors bg-white shadow-xs"
              >
                <FaImage className="text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Add photo/video</span>
              </div>
            ) : (
              <div className="relative mt-1 border border-gray-200 rounded-lg overflow-hidden w-fit bg-gray-100">
                {mediaFile.type.startsWith('video/') ? (
                  <video src={mediaPreviewUrl!} className="h-32 object-contain" />
                ) : (
                  <img src={mediaPreviewUrl!} alt="Preview" className="h-32 object-contain" />
                )}
                <button 
                  onClick={removeMedia}
                  className="absolute top-1 right-1 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80 transition-colors"
                >
                  <FaTimes className="text-xs" />
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

          {/* Text Details */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-800">Post details</label>
            <div className="border border-gray-300 rounded-lg overflow-hidden bg-white focus-within:ring-2 focus-within:ring-[#ff9b8f] focus-within:border-[#ff9b8f] transition-all">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full p-3 h-32 outline-none resize-none text-sm text-gray-800"
                maxLength={maxChars}
              />
              <div className="flex justify-end p-2 bg-gray-50/50 border-t border-gray-100 text-xs text-gray-400 font-medium">
                {message.length} / {maxChars}
              </div>
            </div>
          </div>

          {/* Call To Action (Optional) */}
          <div className="flex flex-col gap-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <label className="text-sm font-semibold text-gray-800">Call to Action (Optional)</label>
            <div className="grid grid-cols-2 gap-3">
              <select 
                value={buttonType} 
                onChange={(e) => setButtonType(e.target.value)}
                className="p-2.5 border border-gray-300 rounded-lg text-sm bg-white outline-none"
              >
                <option value="">No Button</option>
                <option value="LEARN_MORE">Learn More</option>
                <option value="SHOP_NOW">Shop Now</option>
                <option value="SIGN_UP">Sign Up</option>
                <option value="BOOK_NOW">Book Now</option>
              </select>
              <input 
                type="url" 
                value={buttonLink} 
                onChange={(e) => setButtonLink(e.target.value)} 
                placeholder="https://yoursite.com"
                className="p-2.5 border border-gray-300 rounded-lg text-sm bg-white outline-none"
                disabled={!buttonType}
              />
            </div>
          </div>

          {/* Scheduling */}
          <div className="flex flex-col gap-2 mb-4">
            <label className="text-sm font-semibold text-gray-800">Scheduling</label>
            <input
              type="datetime-local"
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white outline-none"
            />
            <p className="text-xs text-gray-500">Leave blank to publish immediately.</p>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 shrink-0">
          <button 
            onClick={() => {setMessage(''); removeMedia(); setScheduleTime('');}}
            className="px-5 py-2 rounded-lg text-sm font-semibold text-gray-600 bg-white border border-gray-300 hover:bg-gray-100 transition-colors"
          >
            Clear
          </button>
          <button
            onClick={handleSubmit}
            disabled={(!message.trim() && !mediaFile) || isSubmitting || !selectedPage}
            className="px-6 py-2 bg-[#1877F2] hover:bg-[#166FE5] text-white rounded-lg text-sm font-bold transition-colors disabled:bg-blue-300 flex items-center justify-center min-w-[100px]"
          >
            {isSubmitting ? 'Publishing...' : (scheduleTime ? 'Schedule' : 'Publish')}
          </button>
        </div>
      </div>

      {/* RIGHT PANE: Preview Section */}
      <div className="w-full lg:w-[55%] flex flex-col bg-gray-100/50 rounded-2xl overflow-hidden border border-gray-200 shadow-sm h-full">
        <div className="p-4 border-b border-gray-200 bg-white sticky top-0 flex justify-between items-center shrink-0">
          <h2 className="text-lg font-bold text-gray-800">Facebook Feed preview</h2>
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded bg-gray-200 flex items-center justify-center text-gray-500 text-xs">💻</div>
            <div className="w-6 h-6 rounded bg-transparent flex items-center justify-center text-gray-400 text-xs">📱</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center custom-scrollbar">
          {/* Facebook Post Card UI */}
          <div className="w-full max-w-[500px] bg-white border border-gray-200 rounded-xl shadow-sm h-fit overflow-hidden">
            
            {/* Header */}
            <div className="p-3 flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0">
                {profileInitial}
              </div>
              <div className="flex flex-col flex-1 leading-tight">
                <span className="font-bold text-sm text-gray-900">{pageName}</span>
                <div className="flex items-center gap-1 text-[13px] text-gray-500 mt-0.5">
                  <span>{scheduleTime ? 'Scheduled' : 'Just now'}</span>
                  <span>·</span>
                  <FaGlobeAmericas className="text-[11px]" />
                </div>
              </div>
            </div>

            {/* Text Content */}
            {message && (
              <div className="px-3 pb-3 text-sm text-gray-900 whitespace-pre-wrap break-words">
                {message}
              </div>
            )}

            {/* Media Content */}
            {mediaPreviewUrl ? (
              <div className="w-full max-h-[500px] bg-black flex items-center justify-center overflow-hidden">
                {mediaFile?.type.startsWith('video/') ? (
                   <video src={mediaPreviewUrl} className="w-full h-auto object-contain max-h-[500px]" controls />
                ) : (
                   <img src={mediaPreviewUrl} alt="Post preview" className="w-full h-auto object-contain max-h-[500px]" />
                )}
              </div>
            ) : (
              // Placeholder Media
              <div className="w-full aspect-video bg-gray-100 flex items-center justify-center border-y border-gray-100">
                 <div className="w-1/2 aspect-video bg-gray-200 rounded flex flex-col items-center justify-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white/50"></div>
                    <div className="flex gap-2">
                      <div className="w-12 h-6 bg-white/50 clip-mountain-1"></div>
                      <div className="w-8 h-4 bg-white/50 clip-mountain-2 self-end"></div>
                    </div>
                 </div>
              </div>
            )}

            {/* Action Buttons (Fake) */}
            <div className="px-3 py-1 mt-1">
              <div className="border-t border-gray-200 flex items-center justify-between pt-1">
                <button className="flex-1 flex items-center justify-center gap-2 text-gray-500 text-sm font-semibold py-1.5 hover:bg-gray-100 rounded transition-colors">
                  <FaThumbsUp className="text-lg" />
                  Like
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 text-gray-500 text-sm font-semibold py-1.5 hover:bg-gray-100 rounded transition-colors">
                  <FaRegCommentAlt className="text-lg" />
                  Comment
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 text-gray-500 text-sm font-semibold py-1.5 hover:bg-gray-100 rounded transition-colors">
                  <FaShare className="text-lg" />
                  Share
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
