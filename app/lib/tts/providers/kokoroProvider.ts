import { TTSProvider, UnifiedTTSRequest, UnifiedTTSResponse } from '../types';
import { generateWithReplicate } from '../../replicateService';
import { formatErrorMessage } from '../../errorUtils';

export class KokoroProvider implements TTSProvider {
  async generateAudio(request: UnifiedTTSRequest): Promise<UnifiedTTSResponse> {
    const { text, voiceId, options = {} } = request;
    const speed = typeof options.speed === 'number' ? options.speed : 1.0;
    const targetVoice = voiceId || 'af_sarah';

    // 1. Check if Replicate is selected or explicitly enabled
    const useReplicate =
      request.modelId === 'kokoro-replicate' ||
      process.env.NEXT_PUBLIC_USE_REPLICATE === 'true';

    if (useReplicate && process.env.REPLICATE_API_TOKEN) {
      const result = await generateWithReplicate({
        text,
        voice: targetVoice,
        speed,
      });

      const id = `vo_kokoro_rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      return {
        id,
        audioUrl: result.audioUrl,
        fileSize: result.audioBuffer.byteLength,
        expiresAt,
        remainingUses: 999,
        resetAt: null,
        format: 'wav',
        metadata: { voice_name: targetVoice, provider: 'replicate' },
      };
    }

    // 2. Default: Kokoro TTS Local Gateway (/api/v1/audio/speech)
    const apiUrl = process.env.VOICEOVER_API_URL || 'http://localhost:8000';

    // Determine language from voice prefix
    let lang = 'en-us';
    if (targetVoice.startsWith('bf_') || targetVoice.startsWith('bm_')) {
      lang = 'en-gb';
    } else if (targetVoice.startsWith('hf_') || targetVoice.startsWith('hm_')) {
      lang = 'hi';
    } else if (targetVoice.startsWith('ff_')) {
      lang = 'fr-fr';
    } else if (targetVoice.startsWith('if_') || targetVoice.startsWith('im_')) {
      lang = 'it';
    }

    // Primary endpoint: /api/v1/audio/speech
    const primaryEndpoint = `${apiUrl}/api/v1/audio/speech`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (process.env.KOKORO_API_KEY) {
      headers['X-API-Key'] = process.env.KOKORO_API_KEY;
    }

    let response = await fetch(primaryEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        text,
        voice: targetVoice,
        speed,
        lang,
      }),
    });

    // Fallback to legacy endpoint if primary /api/v1/audio/speech is 404
    if (response.status === 404) {
      response = await fetch(`${apiUrl}/api/voiceover/free_tool`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          text,
          voice_id: targetVoice,
          speed,
          pitch: options.pitch ?? 1.0,
          volume: options.volume ?? 0.8,
          tone: options.tone ?? 'neutral',
        }),
      });
    }

    if (!response.ok) {
      let errorMessage = 'Failed to generate voiceover with Kokoro Gateway';
      try {
        const error = await response.json();
        errorMessage = formatErrorMessage(error);
      } catch {
        errorMessage = (await response.text()) || `Kokoro API returned status ${response.status}`;
      }
      throw new Error(errorMessage);
    }

    const contentType = response.headers.get('content-type') || '';
    const id = `vo_kokoro_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // If server returned JSON with metadata / audio_url
    if (contentType.includes('application/json')) {
      const data = await response.json();
      return {
        id: data.id || id,
        audioUrl: data.audio_url || data.url,
        durationSeconds: data.duration_seconds || 0,
        fileSize: data.file_size || 0,
        expiresAt: data.expires_at || expiresAt,
        remainingUses: data.remaining_uses ?? 999,
        resetAt: data.reset_at ?? null,
        format: 'wav',
        metadata: { voice_name: data.voice_name || targetVoice, provider: 'local_gateway' },
      };
    }

    // Binary audio/wav stream from /api/v1/audio/speech - convert to base64 data URL
    const arrayBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString('base64');
    const audioUrl = `data:audio/wav;base64,${base64Audio}`;

    return {
      id,
      audioUrl,
      durationSeconds: 0,
      fileSize: arrayBuffer.byteLength,
      expiresAt,
      remainingUses: 999,
      resetAt: null,
      format: 'wav',
      metadata: { voice_name: targetVoice, provider: 'local_gateway' },
    };
  }
}
