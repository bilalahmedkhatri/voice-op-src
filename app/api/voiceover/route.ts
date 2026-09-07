import { NextRequest, NextResponse } from 'next/server';
import { generateSpeech } from '@/app/lib/tts/unifiedService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      text,
      voice_id,
      voice,
      model_id,
      modelId,
      options = {},
      speed,
      pitch,
      volume,
      tone,
      temperature,
      top_p,
      repetition_penalty,
    } = body;

    const targetVoiceId = voice_id || voice;
    const targetModelId = model_id || modelId || 'kokoro-82m';

    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json(
        { error: 'Text is required and must not be empty' },
        { status: 400 }
      );
    }

    if (!targetVoiceId || typeof targetVoiceId !== 'string') {
      return NextResponse.json(
        { error: 'Voice ID is required and must be a string' },
        { status: 400 }
      );
    }

    // Combine any top-level option props into options dict
    const mergedOptions = {
      ...options,
      ...(speed !== undefined ? { speed } : {}),
      ...(pitch !== undefined ? { pitch } : {}),
      ...(volume !== undefined ? { volume } : {}),
      ...(tone !== undefined ? { tone } : {}),
      ...(temperature !== undefined ? { temperature } : {}),
      ...(top_p !== undefined ? { top_p } : {}),
      ...(repetition_penalty !== undefined ? { repetition_penalty } : {}),
    };

    const result = await generateSpeech({
      modelId: targetModelId,
      voiceId: targetVoiceId,
      text,
      options: mergedOptions,
    });

    return NextResponse.json({
      id: result.id,
      audio_url: result.audioUrl,
      voice_name: result.metadata?.voice_name || targetVoiceId,
      duration_seconds: result.durationSeconds || 0,
      file_size: result.fileSize || 0,
      expires_at: result.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      remaining_uses: result.remainingUses ?? 999,
      reset_at: result.resetAt ?? null,
      model_id: targetModelId,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to generate voiceover.' },
      { status: error.status || 500 }
    );
  }
}
