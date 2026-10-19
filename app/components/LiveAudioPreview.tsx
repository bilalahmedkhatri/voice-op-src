'use client';

import {useCopy} from '@/i18n/copy';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ownerFetch, currentOwnerScope } from '@/app/lib/ownerStorage';
import Button from '@/components/ui/Button';
import { FiHeadphones, FiPause } from 'react-icons/fi';

export type LiveJob = { jobId: string; jobToken?: string; ownerScope: string; attempt: number };

export default function LiveAudioPreview({ job }: { job: LiveJob | null }) {
  const copy = useCopy();


  const audio = useRef<HTMLAudioElement>(null);
  const queue = useRef<{ index: number; url: string }[]>([]);
  const nextIndex = useRef(0);
  const playing = useRef<string | null>(null);
  const listening = useRef(false);
  const [ready, setReady] = useState(false);
  const [isListening, setListening] = useState(false);
  const [part, setPart] = useState<number | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  const playNext = useCallback(() => {
    if (!listening.current || !audio.current || playing.current) return;
    const next = queue.current.shift();
    if (!next) return;
    playing.current = next.url;
    audio.current.src = next.url;
    setPart(next.index + 1);
    audio.current.play().catch(() => { listening.current = false; setListening(false); });
  }, []);

  // Keep consumed indexes on retry; a new job or unmount releases every object URL.
  useEffect(() => {
    nextIndex.current = 0;
    const element = audio.current;
    return () => {
      element?.pause();
      for (const entry of queue.current) URL.revokeObjectURL(entry.url);
      if (playing.current) URL.revokeObjectURL(playing.current);
      queue.current = []; playing.current = null; listening.current = false;
    };
  }, [job?.jobId]);

  useEffect(() => {
    if (!job) return;
    const controller = new AbortController();
    const receive = async () => {
      let failures = 0;
      while (!controller.signal.aborted) {
        let terminal = false;
        try {
          const response = await ownerFetch(`/api/templates/audio-job/stream?jobId=${encodeURIComponent(job.jobId)}&after=${nextIndex.current}`, {
            headers: job.jobToken ? { 'X-Voice-Job-Token': job.jobToken } : {}, signal: controller.signal,
          });
          if ([401, 403, 404].includes(response.status)) { setUnavailable(true); return; }
          if (!response.ok || !response.body) throw new Error(copy("Preview unavailable"));
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffered = '';
          try {
            while (true) {
              const { value, done } = await reader.read();
              if (controller.signal.aborted || currentOwnerScope() !== job.ownerScope) return;
              buffered += decoder.decode(value, { stream: !done });
              const lines = buffered.split('\n');
              buffered = lines.pop() || '';
              for (const line of lines) {
                if (!line.trim()) continue;
                const event = JSON.parse(line);
                if (event.event === 'error') throw new Error(copy("Preview unavailable"));
                if (['completed', 'failed'].includes(event.event)) terminal = true;
                if (event.event !== 'chunk') continue;
                if (event.index !== nextIndex.current) throw new Error(copy("Preview order mismatch"));
                const bytes = Uint8Array.from(atob(event.audio), character => character.charCodeAt(0));
                queue.current.push({ index: event.index, url: URL.createObjectURL(new Blob([bytes], { type: 'audio/wav' })) });
                nextIndex.current++;
                failures = 0;
                setReady(true); setUnavailable(false);
                playNext();
              }
              if (done) break;
            }
          } finally { await reader.cancel().catch(() => {}); }
          if (terminal) return;
          throw new Error(copy("Preview connection ended"));
        } catch {
          if (controller.signal.aborted) return;
          setUnavailable(true);
          if (++failures > 3) return;
          await new Promise(resolve => setTimeout(resolve, 1000 * 2 ** (failures - 1)));
        }
      }
    };
    void receive();
    return () => controller.abort();
  }, [copy, job, playNext]);

  if (!job) return null;
  return <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
    <audio ref={audio} onEnded={() => {
      if (playing.current) URL.revokeObjectURL(playing.current);
      playing.current = null;
      playNext();
    }} onError={() => { listening.current = false; setListening(false); setUnavailable(true); }} />
    {ready && <Button size="sm" variant="secondary" icon={isListening ? <FiPause /> : <FiHeadphones />} onClick={() => {
      listening.current = !listening.current; setListening(listening.current);
      if (!listening.current) audio.current?.pause();
      else if (playing.current) void audio.current?.play().catch(() => { listening.current = false; setListening(false); });
      else playNext();
    }}>{isListening ? copy("Pause live preview") : copy("Listen live")}</Button>}
    {part !== null && <span role="status">{copy("Live preview: part ")}{part}</span>}
    {unavailable && <span>{copy("Live preview paused. Your final audio will still be available.")}</span>}
  </div>;
}
