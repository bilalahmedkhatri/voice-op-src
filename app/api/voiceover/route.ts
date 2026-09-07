import { NextRequest, NextResponse } from 'next/server';
import { generateSpeech } from '@/app/lib/tts/unifiedService';
import { getCurrentUser } from '@/app/lib/auth/googleAuth';
import { getDb } from '@/app/lib/db';
import { getModelDefinition } from '@/app/lib/tts/registry';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

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
        { error: 'Text is required and must not be empty.' },
        { status: 400 }
      );
    }

    if (!targetVoiceId || typeof targetVoiceId !== 'string') {
      return NextResponse.json(
        { error: 'Voice ID is required and must be a string.' },
        { status: 400 }
      );
    }

    // Check DB User & Quota if logged in
    const user = await getCurrentUser();
    const sql = getDb();

    if (user && sql) {
      const quotaRows = await sql`
        SELECT generations_used, max_daily_generations, max_chars_per_request, chars_used_today, max_daily_chars, reset_at
        FROM user_quotas
        WHERE user_id = ${user.id}
        LIMIT 1
      `;

      if (quotaRows && quotaRows.length > 0) {
        const q = quotaRows[0];
        const isResetDue = new Date() >= new Date(q.reset_at);

        if (isResetDue) {
          const nextReset = new Date();
          nextReset.setUTCHours(24, 0, 0, 0);
          await sql`
            UPDATE user_quotas
            SET generations_used = 0, chars_used_today = 0, reset_at = ${nextReset.toISOString()}, updated_at = NOW()
            WHERE user_id = ${user.id}
          `;
        } else {
          // Check if user exceeded daily generations
          if (q.max_daily_generations > 0 && q.generations_used >= q.max_daily_generations) {
            return NextResponse.json(
              { error: `Daily generation limit (${q.max_daily_generations}) reached. Resets at midnight UTC.` },
              { status: 429 }
            );
          }
          // Check if user exceeded daily character quota
          if (q.max_daily_chars > 0 && q.chars_used_today + text.length > q.max_daily_chars) {
            return NextResponse.json(
              { error: `Daily character quota limit (${q.max_daily_chars.toLocaleString()}) exceeded.` },
              { status: 429 }
            );
          }
        }
      }
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

    const elapsedSeconds = Math.round(((Date.now() - startTime) / 1000) * 10) / 10;
    const modelDef = getModelDefinition(targetModelId);

    // Save record to DB for authenticated user
    if (user && sql) {
      try {
        const historyId = `gh_${crypto.randomUUID().replace(/-/g, '')}`;
        await sql`
          INSERT INTO generation_history (
            id, user_id, prompt_text, model_id, model_name, voice_id, voice_name, audio_url, duration_sec, generation_time_sec, parameters, created_at
          )
          VALUES (
            ${historyId},
            ${user.id},
            ${text},
            ${targetModelId},
            ${modelDef.name || targetModelId},
            ${targetVoiceId},
            ${result.metadata?.voice_name || targetVoiceId},
            ${result.audioUrl || null},
            ${result.durationSeconds || null},
            ${elapsedSeconds},
            ${JSON.stringify(mergedOptions)},
            NOW()
          )
        `;

        await sql`
          UPDATE user_quotas
          SET generations_used = generations_used + 1,
              chars_used_today = chars_used_today + ${text.length},
              updated_at = NOW()
          WHERE user_id = ${user.id}
        `;
      } catch (dbError) {
        console.error('Failed to log generation history in DB:', dbError);
      }
    }

    return NextResponse.json({
      id: result.id,
      audio_url: result.audioUrl,
      voice_name: result.metadata?.voice_name || targetVoiceId,
      duration_seconds: result.durationSeconds || 0,
      generation_time_sec: elapsedSeconds,
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
