'use client';

import {errorCopy} from '@/i18n/errors';

import {useCopy} from '@/i18n/copy';

import { useEffect, useState } from 'react';
import { ownerFetch } from '../lib/ownerStorage';
import { pendingAudioJobs, removePendingAudioJob } from '../lib/pendingAudioJobs';
import GenerationStatus from './GenerationStatus';

export default function AudioJobRecovery({ jobId, onReady }: { jobId: string; onReady: (url: string) => void }) {
  const copy = useCopy();


  const [progress, setProgress] = useState<{ completed: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(false);
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const token = pendingAudioJobs().find(job => job.jobId === jobId)?.jobToken;
    const headers = token ? { 'X-Voice-Job-Token': token } : undefined;
    const poll = async () => {
      setBusy(true);
      try {
        for (let count = 0; count < 50 && !controller.signal.aborted; count++) {
          const response = await ownerFetch(`/api/templates/audio-job/status?jobId=${encodeURIComponent(jobId)}`, {
            headers, cache: 'no-store', signal: controller.signal,
          });
          if (!response.ok) throw new Error(copy("Unable to access this voiceover."));
          const data = await response.json();
          if (controller.signal.aborted) return;
          setProgress(data.chunks || null); setRetry(data.retry_available === true);
          setError(data.error || null);
          if (data.status === 'completed' && data.audio_url) {
            removePendingAudioJob(jobId); onReady(data.audio_url); return;
          }
          if (data.status === 'failed') return;
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      } catch (failure) {
        if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : 'Unable to check voiceover.');
      } finally { if (!controller.signal.aborted) setBusy(false); }
    };
    void poll();
    return () => controller.abort();
  }, [copy, jobId, attempt, onReady]);
  const resume = async () => {
    setBusy(true);
    try {
      if (retry) {
        const token = pendingAudioJobs().find(job => job.jobId === jobId)?.jobToken;
        const response = await ownerFetch('/api/templates/audio-job/retry', { method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { 'X-Voice-Job-Token': token } : {}) },
          body: JSON.stringify({ jobId }) });
        if (!response.ok && response.status !== 409) throw new Error(copy("Unable to retry this voiceover."));
      }
      setAttempt(value => value + 1);
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Unable to retry.'); setBusy(false); }
  };
  return <GenerationStatus progress={progress} errorMessage={errorCopy(error, copy)} isGenerating={busy}
    retryAvailable={retry} onResume={() => void resume()} />;
}
