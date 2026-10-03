import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const modelParam = searchParams.get('model');
    const voiceParam = searchParams.get('voice');
    
    if (!modelParam || !voiceParam) {
      return new NextResponse('Model and Voice parameters are required', { status: 400 });
    }

    // 1. Check local pre-generated voice samples first (e.g. Kokoro 54 voices)
    const localSamplePath = join(process.cwd(), 'app', 'voice_samples', `${voiceParam}.wav`);
    if (existsSync(localSamplePath)) {
      const audioBuffer = readFileSync(localSamplePath);
      return new NextResponse(audioBuffer, {
        headers: {
          'Content-Type': 'audio/wav',
          'Content-Length': audioBuffer.length.toString(),
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    // 2. Fallback to backend gateway for dynamic samples (e.g. Gemini voice samples)
    const apiUrl = process.env.VOICEOVER_API_URL || 'http://localhost:8000';
    const targetUrl = `${apiUrl}/api/v1/audio/sample?model=${encodeURIComponent(modelParam)}&voice=${encodeURIComponent(voiceParam)}`;
    
    const response = await fetch(targetUrl, {
      signal: AbortSignal.timeout(30000), // 30s timeout to allow Gemini generation & caching
    });
    
    if (!response.ok) {
      return new NextResponse(`Backend audio fetch failed: ${response.status}`, { status: response.status });
    }
    
    const contentType = response.headers.get('content-type') || 'audio/wav';
    const data = await response.arrayBuffer();
    
    return new NextResponse(data, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error('Error proxying sample audio:', error);
    return new NextResponse('Internal Server Error while fetching audio sample', { status: 500 });
  }
}

