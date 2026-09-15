'use client';

import { useState } from 'react';
import { FaPaperPlane, FaClock, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

interface FacebookPostFormProps {
  pageId: string;
  pageName: string;
  onDisconnect: () => void;
}

export default function FacebookPostForm({ pageId, pageName, onDisconnect }: FacebookPostFormProps) {
  const [message, setMessage] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    setStatus(null);

    let scheduled_publish_time = null;
    if (scheduleTime) {
      // Convert datetime-local to Unix timestamp in seconds
      scheduled_publish_time = Math.floor(new Date(scheduleTime).getTime() / 1000);
      
      // Basic validation: Facebook requires scheduled time to be between 10 mins and 75 days
      const now = Math.floor(Date.now() / 1000);
      if (scheduled_publish_time < now + 600) {
        setStatus({ type: 'error', text: 'Scheduled time must be at least 10 minutes in the future.' });
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${apiUrl}/api/v1/facebook/post-pages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page_id: pageId,
          message,
          scheduled_publish_time
        })
      });

      const data = await res.json();

      if (res.ok && data.status === 'success') {
        setStatus({ type: 'success', text: scheduled_publish_time ? 'Post scheduled successfully!' : 'Post published successfully!' });
        setMessage('');
        setScheduleTime('');
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

  return (
    <div className="flex flex-col p-6 sm:p-8 border border-gray-100 rounded-2xl bg-white shadow-sm">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
        <div>
          <h3 className="text-xl font-bold text-gray-800">Create a Post</h3>
          <p className="text-sm text-gray-500 mt-1">
            Posting to <span className="font-semibold text-gray-700">{pageName}</span>
          </p>
        </div>
        <button
          onClick={onDisconnect}
          className="text-sm font-semibold text-gray-500 hover:text-red-500 transition-colors"
        >
          Disconnect
        </button>
      </div>

      {status && (
        <div className={`mb-6 p-4 rounded-xl text-sm flex items-start gap-3 border ${
          status.type === 'success' 
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
            : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {status.type === 'success' ? (
            <FaCheckCircle className="text-emerald-500 text-lg shrink-0 mt-0.5" />
          ) : (
            <FaExclamationCircle className="text-red-500 text-lg shrink-0 mt-0.5" />
          )}
          <span>{status.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="message" className="text-sm font-semibold text-gray-700">
            Message
          </label>
          <textarea
            id="message"
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#ff9b8f] focus:border-[#ff9b8f] outline-none transition-all resize-none text-gray-800 text-sm"
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="scheduleTime" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <FaClock className="text-gray-400" />
            Schedule (Optional)
          </label>
          <input
            type="datetime-local"
            id="scheduleTime"
            value={scheduleTime}
            onChange={(e) => setScheduleTime(e.target.value)}
            className="w-full sm:w-auto p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#ff9b8f] focus:border-[#ff9b8f] outline-none transition-all text-gray-700 text-sm"
          />
          <p className="text-xs text-gray-500">Leave blank to publish immediately.</p>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={!message.trim() || isSubmitting}
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-[#ff9b8f] to-[#ffb4a8] hover:from-[#f8887a] hover:to-[#ffa79a] text-white rounded-xl text-sm font-bold cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md disabled:bg-gray-200 disabled:from-gray-200 disabled:to-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
          >
            <FaPaperPlane className="text-xs" />
            <span>
              {isSubmitting
                ? 'Processing...'
                : scheduleTime
                ? 'Schedule Post'
                : 'Publish Now'}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}
