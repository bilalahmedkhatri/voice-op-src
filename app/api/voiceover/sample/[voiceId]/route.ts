import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ voiceId: string }> }
) {
  try {
    const { voiceId } = await params;
    
    // 1. Check local filesystem voice_samples directory first (e.g. Kokoro samples)
    const samplePath = join(process.cwd(), 'app', 'voice_samples', `${voiceId}.wav`);
    
    if (existsSync(samplePath)) {
      const audioBuffer = readFileSync(samplePath);
      return new NextResponse(audioBuffer, {
        headers: {
          'Content-Type': 'audio/wav',
          'Content-Length': audioBuffer.length.toString(),
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    // 2. If not on local disk, proxy from backend gateway (e.g. Gemini 2.0 Flash / Gateway samples)
    const apiUrl = process.env.VOICEOVER_API_URL || 'http://localhost:8000';

    // Try Gemini sample endpoint first
    try {
      const geminiEndpoint = `${apiUrl}/api/v1/audio/gemini-sample?voice=${encodeURIComponent(voiceId)}`;
      const res = await fetch(geminiEndpoint);
      if (res.ok) {
        const audioBuffer = await res.arrayBuffer();
        return new NextResponse(audioBuffer, {
          headers: {
            'Content-Type': res.headers.get('content-type') || 'audio/wav',
            'Content-Length': audioBuffer.byteLength.toString(),
            'Cache-Control': 'public, max-age=86400',
          },
        });
      }
    } catch {
      // ignore & try fallback
    }

    // Try general sample endpoint /api/v1/audio/sample?voice=...
    try {
      const generalEndpoint = `${apiUrl}/api/v1/audio/sample?voice=${encodeURIComponent(voiceId)}`;
      const res = await fetch(generalEndpoint);
      if (res.ok) {
        const audioBuffer = await res.arrayBuffer();
        return new NextResponse(audioBuffer, {
          headers: {
            'Content-Type': res.headers.get('content-type') || 'audio/wav',
            'Content-Length': audioBuffer.byteLength.toString(),
            'Cache-Control': 'public, max-age=86400',
          },
        });
      }
    } catch {
      // ignore
    }
    
    return NextResponse.json(
      { error: `Sample not found for voice: ${voiceId}` },
      { status: 404 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to load voice sample' },
      { status: 500 }
    );
  }
}
