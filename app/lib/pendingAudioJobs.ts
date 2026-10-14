'use client';

import { ownerDraftKey, currentOwnerScope } from './ownerStorage';
import type { VoiceParams } from '../types';

export type PendingGeneration = {
  jobId: string; jobToken?: string; ownerScope: string;
  params: VoiceParams; voice: string; model: string; provider?: string;
  format: 'short' | 'long';
};

export function pendingJobFromHistory(row: { id?: string; audio_url?: string | null; prompt_text?: string;
  voice_id?: string; model_id?: string; parameters?: string | Record<string, unknown> | null }, ownerScope: string): PendingGeneration | null {
  try {
    const options = typeof row.parameters === 'string' ? JSON.parse(row.parameters) : row.parameters;
    if (row.audio_url || options?.server_owned_job !== true || options.gateway_job_missing === true || !row.id || !row.voice_id || !row.model_id || typeof row.prompt_text !== 'string') return null;
    return { jobId: row.id, ownerScope, voice: row.voice_id, model: row.model_id,
      params: { text: row.prompt_text, voice: row.voice_id, rate: options.speed || 1, pitch: options.pitch || 1,
        volume: options.volume || 1, options }, format: options.video_format === 'long' ? 'long' : 'short' };
  } catch { return null; }
}

export function pendingAudioJobs(): PendingGeneration[] {
  try {
    const scope = currentOwnerScope();
    const records = JSON.parse(localStorage.getItem(ownerDraftKey('pending_audio_jobs')) || '[]');
    return Array.isArray(records) ? records.filter(job => job && job.ownerScope === scope
      && typeof job.jobId === 'string' && typeof job.voice === 'string' && typeof job.model === 'string'
      && typeof job.params?.text === 'string' && ['short', 'long'].includes(job.format)) : [];
  } catch { return []; }
}

export function savePendingAudioJob(job: PendingGeneration) {
  if (job.ownerScope !== currentOwnerScope()) throw new Error('Account changed during generation.');
  try {
    const records = [job, ...pendingAudioJobs().filter(entry => entry.jobId !== job.jobId)];
    localStorage.setItem(ownerDraftKey('pending_audio_jobs'), JSON.stringify(records));
    window.dispatchEvent(new Event('pending-audio-updated'));
  } catch { /* Private-mode storage failure must not restart or charge generation. */ }
}

export function removePendingAudioJob(jobId: string) {
  try {
    localStorage.setItem(ownerDraftKey('pending_audio_jobs'), JSON.stringify(pendingAudioJobs().filter(job => job.jobId !== jobId)));
    window.dispatchEvent(new Event('pending-audio-updated'));
  } catch { /* The owned status route still determines accessibility/completion. */ }
}
