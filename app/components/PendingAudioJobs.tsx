'use client';

import {useCopy} from '@/i18n/copy';

import { useEffect, useState } from 'react';
import {Link} from '@/i18n/navigation';
import { currentOwnerScope, knownOwnerScope, resolveOwnerScope, setOwnerScope, ownerFetch } from '../lib/ownerStorage';
import { pendingAudioJobs, pendingJobFromHistory, savePendingAudioJob, removePendingAudioJob, type PendingGeneration } from '../lib/pendingAudioJobs';
import { isDatabaseEnabled } from '../lib/config';
import { saveLocalHistoryItem } from '../lib/localHistoryStorage';

export default function PendingAudioJobs() {
  const copy = useCopy();


  const [jobs, setJobs] = useState<PendingGeneration[]>([]);
  useEffect(() => {
    let cancelled = false;
    let loading = false;
    const load = async () => {
      if (cancelled || loading) return;
      loading = true;
      try {
        const previousScope = knownOwnerScope();
        const scope = await resolveOwnerScope();
        if (cancelled || (previousScope && previousScope !== scope)) return;
        setOwnerScope(scope);
        const records = pendingAudioJobs();
        if (isDatabaseEnabled()) {
          const response = await ownerFetch('/api/history?pending=true', { cache: 'no-store' });
          const data = response.ok ? await response.json() : {};
          if (cancelled || currentOwnerScope() !== scope) return;
          for (const row of data.items || []) {
            const job = pendingJobFromHistory(row, scope);
            if (job && !records.some(record => record.jobId === job.jobId)) {
              records.push(job);
              savePendingAudioJob(job);
            }
          }
        }
        const remaining: PendingGeneration[] = [];
        let completed = false;
        for (let offset = 0; offset < records.length; offset += 3) {
          const results = await Promise.all(records.slice(offset, offset + 3).map(async job => {
            try {
              const response = await ownerFetch(`/api/templates/audio-job/status?jobId=${encodeURIComponent(job.jobId)}`, {
                cache: 'no-store', signal: AbortSignal.timeout(30000),
                headers: job.jobToken ? { 'X-Voice-Job-Token': job.jobToken } : {},
              });
              if (cancelled || currentOwnerScope() !== scope) return null;
              if ([401, 403, 404].includes(response.status)) { removePendingAudioJob(job.jobId); return null; }
              const status = response.ok ? await response.json() : {};
              if (cancelled || currentOwnerScope() !== scope) return null;
              if (status.status !== 'completed' || !status.audio_url) return job;
              if (!isDatabaseEnabled()) {
                const audio = await ownerFetch(status.audio_url);
                if (!audio.ok) return job;
                const audioBlob = await audio.blob();
                if (cancelled || currentOwnerScope() !== scope) return null;
                await saveLocalHistoryItem({ id: job.jobId, prompt_text: job.params.text, model_id: job.model,
                  model_name: job.model, voice_id: job.voice, voice_name: status.voice_name || job.voice,
                  audioBlob, parameters: job.params.options, video_format: job.format,
                  duration_sec: status.duration_seconds }, scope);
              }
              removePendingAudioJob(job.jobId);
              completed = true;
              return null;
            } catch { return job; }
          }));
          remaining.push(...results.filter((job): job is PendingGeneration => job !== null));
        }
        if (!cancelled && currentOwnerScope() === scope) {
          setJobs(remaining);
          if (completed) window.dispatchEvent(new Event('audio-library-updated'));
        }
      } catch { /* Account/connection errors leave private jobs hidden. */ }
      finally { loading = false; }
    };
    const refresh = () => { void load(); };
    void load();
    window.addEventListener('pending-audio-updated', refresh);
    window.addEventListener('storage', refresh);
    window.addEventListener('focus', refresh);
    const timer = window.setInterval(refresh, 15000);
    return () => { cancelled = true; window.clearInterval(timer); window.removeEventListener('focus', refresh);
      window.removeEventListener('pending-audio-updated', refresh); window.removeEventListener('storage', refresh); };
  }, []);
  if (!jobs.length) return null;
  return <section className="space-y-3 rounded-xl bg-orange-50 p-4">
    <h2 className="font-semibold text-slate-900">{copy("Unfinished voiceovers")}</h2>
    {jobs.map(job => <div key={job.jobId} className="flex flex-wrap items-center justify-between gap-3 text-sm">
      <span className="max-w-lg truncate">{job.params.text.slice(0, 80) || copy("Voiceover")}</span>
      <Link className="rounded-lg bg-[#ff7d6e] px-3 py-2 font-semibold text-slate-900" href={`/admin?resumeJob=${encodeURIComponent(job.jobId)}`}>
        {copy("Resume in Studio")}</Link>
    </div>)}
  </section>;
}
