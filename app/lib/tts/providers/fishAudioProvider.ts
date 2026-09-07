import { TTSProvider, UnifiedTTSRequest, UnifiedTTSResponse } from '../types';

export class FishAudioProvider implements TTSProvider {
  async generateAudio(request: UnifiedTTSRequest): Promise<UnifiedTTSResponse> {
    const { text, voiceId, options = {} } = request;
    const speed = typeof options.speed === 'number' ? options.speed : 1.0;
    const temperature = typeof options.temperature === 'number' ? options.temperature : 0.7;
    const top_p = typeof options.top_p === 'number' ? options.top_p : 0.7;
    const repetition_penalty = typeof options.repetition_penalty === 'number' ? options.repetition_penalty : 1.2;

    const apiUrl = process.env.FISH_AUDIO_API_URL || 'http://localhost:8080';

    // Fish-Speech local server standard endpoint /v1/tts or /api/tts
    const endpoint = `${apiUrl}/v1/tts`;

    const payload = {
      text,
      reference_id: voiceId,
      temperature,
      top_p,
      repetition_penalty,
      prosody: {
        speed,
        volume: 0,
      },
      format: 'wav',
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.FISH_AUDIO_API_KEY ? { Authorization: `Bearer ${process.env.FISH_AUDIO_API_KEY}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to generate voiceover with Fish Audio';
      try {
        const error = await response.json();
        errorMessage = error.detail || error.message || JSON.stringify(error);
      } catch {
        errorMessage = (await response.text()) || `Fish Audio server returned status ${response.status}`;
      }
      throw new Error(errorMessage);
    }

    // Check if server returns JSON with audio_url or direct binary audio
    const contentType = response.headers.get('content-type') || '';
    const id = `vo_fish_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    if (contentType.includes('application/json')) {
      const data = await response.json();
      return {
        id,
        audioUrl: data.audio_url || data.url,
        durationSeconds: data.duration_seconds || 0,
        fileSize: data.file_size || 0,
        expiresAt,
        remainingUses: 999,
        resetAt: null,
        format: 'wav',
        metadata: { voice_id: voiceId, model: 'fish-audio' },
      };
    }

    // Direct audio binary stream - convert to base64 data url for browser playback
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
      metadata: { voice_id: voiceId, model: 'fish-audio' },
    };
  }
}
