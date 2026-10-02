'use client';

import { useState } from 'react';
import { FaPaperPlane, FaClock, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import { Button } from '@/components/ui';

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
    <div className="flex flex-col p-6 sm:p-8 border border-slate-200/80 rounded-2xl bg-white shadow-xs">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">Create a Post</h3>
          <p className="text-sm text-slate-500 mt-1">
            Posting to <span className="font-semibold text-slate-700">{pageName}</span>
          </p>
        </div>
        <button
          onClick={onDisconnect}
          className="text-sm font-semibold text-slate-500 hover:text-rose-500 transition-colors cursor-pointer"
        >
          Disconnect
        </button>
      </div>

      {status && (
        <div className={`mb-6 p-4 rounded-xl text-sm flex items-start gap-3 border ${
          status.type === 'success' 
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
            : 'bg-rose-50 text-rose-700 border-rose-200'
        }`}>
          {status.type === 'success' ? (
            <FaCheckCircle className="text-emerald-500 text-lg shrink-0 mt-0.5" />
          ) : (
            <FaExclamationCircle className="text-rose-500 text-lg shrink-0 mt-0.5" />
          )}
          <span>{status.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="message" className="text-sm font-semibold text-slate-700">
            Message
          </label>
          <textarea
            id="message"
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full p-4 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#ff9b8f]/25 focus:border-[#ff9b8f] outline-none transition-all resize-none text-slate-800 text-sm"
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="scheduleTime" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <FaClock className="text-slate-400" />
            Schedule (Optional)
          </label>
          <input
            type="datetime-local"
            id="scheduleTime"
            value={scheduleTime}
            onChange={(e) => setScheduleTime(e.target.value)}
            className="w-full sm:w-auto p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#ff9b8f]/25 focus:border-[#ff9b8f] outline-none transition-all text-slate-700 text-sm"
          />
          <p className="text-xs text-slate-500">Leave blank to publish immediately.</p>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={!message.trim() || isSubmitting}
            isLoading={isSubmitting}
            className="w-full sm:w-auto shadow-xs hover:shadow-md"
            icon={<FaPaperPlane className="w-3.5 h-3.5" />}
          >
            {isSubmitting ? 'Processing...' : scheduleTime ? 'Schedule Post' : 'Publish Now'}
          </Button>
        </div>
      </form>
    </div>
  );
}
