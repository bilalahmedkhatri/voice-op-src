import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/lib/auth/googleAuth';
import { getDb } from '@/app/lib/db';
import { formatErrorMessage } from '@/app/lib/errorUtils';
import { isDatabaseEnabled } from '@/app/lib/config';

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
      lang = 'en-us'
    } = body;

    const targetVoiceId = voice_id || voice;
    const targetModelId = model_id || modelId;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json(
        { error: 'Text is required and must not be empty.' },
        { status: 400 }
      );
    }

    if (!targetModelId || typeof targetModelId !== 'string') {
      return NextResponse.json(
        { error: 'Model ID is required and must be a string.' },
        { status: 400 }
      );
    }

    // Check DB User & Quota if logged in
    const user = await getCurrentUser();
    const sql = getDb();

    // In Online Database Mode, require Google authentication
    if (isDatabaseEnabled() && !user) {
      return NextResponse.json(
        { error: 'Please sign in with Google to generate voiceovers.' },
        { status: 401 }
      );
    }

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
          if (q.max_daily_generations > 0 && q.generations_used >= q.max_daily_generations) {
            return NextResponse.json(
              { error: `Daily generation limit (${q.max_daily_generations}) reached. Resets at midnight UTC.` },
              { status: 429 }
            );
          }
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

    // Forward to dynamic API
    const apiUrl = process.env.VOICEOVER_API_URL || 'http://localhost:8000';
    const payload = {
      text,
      model: targetModelId,
      voice: targetVoiceId,
      speed: mergedOptions.speed ?? 1.0,
      lang: lang
    };

    let response: Response;
    try {
      response = await fetch(`${apiUrl}/api/v1/audio/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      throw new Error(`Unable to reach backend API at ${apiUrl}. Please ensure the backend server is running.`);
    }

    if (!response.ok) {
      let errorMessage = 'Failed to generate voiceover';
      try {
        const errorData = await response.json();
        errorMessage = formatErrorMessage(errorData);
      } catch {
        errorMessage = (await response.text()) || `Backend API returned status ${response.status}`;
      }
      throw new Error(errorMessage);
    }

    // Read audio data and convert to base64 data URI to match existing UI expectations
    const arrayBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'audio/wav';
    
    // Some endpoints may return JSON with a URL, handle that if needed
    if (contentType.includes('application/json')) {
      const data = JSON.parse(Buffer.from(arrayBuffer).toString('utf-8'));
      return NextResponse.json(data);
    }

    const base64Audio = Buffer.from(arrayBuffer).toString('base64');
    const audioUrl = `data:${contentType};base64,${base64Audio}`;

    const id = `vo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const elapsedSeconds = Math.round(((Date.now() - startTime) / 1000) * 10) / 10;

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
            ${targetModelId},
            ${targetVoiceId},
            ${targetVoiceId},
            ${audioUrl},
            NULL,
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
      id: id,
      audio_url: audioUrl,
      voice_name: targetVoiceId,
      duration_seconds: 0,
      generation_time_sec: elapsedSeconds,
      file_size: arrayBuffer.byteLength,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      remaining_uses: 999,
      reset_at: null,
      model_id: targetModelId,
    });
  } catch (error: any) {
    const errorMsg = formatErrorMessage(error);
    return NextResponse.json(
      { error: errorMsg },
      { status: error?.status || 500 }
    );
  }
}
