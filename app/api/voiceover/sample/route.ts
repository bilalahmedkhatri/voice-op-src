import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const modelParam = searchParams.get('model');
    const voiceParam = searchParams.get('voice');
    
    if (!modelParam || !voiceParam) {
      return new NextResponse('Model and Voice parameters are required', { status: 400 });
    }

    const apiUrl = process.env.VOICEOVER_API_URL || 'http://localhost:8000';
    const targetUrl = `${apiUrl}/api/v1/audio/sample?model=${encodeURIComponent(modelParam)}&voice=${encodeURIComponent(voiceParam)}`;
    
    const response = await fetch(targetUrl, {
      signal: AbortSignal.timeout(10000),
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
