import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const modelParam = searchParams.get('model');
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');
    const searchSearchParam = searchParams.get('search');
    
    if (!modelParam) {
      return NextResponse.json(
        { status: 'error', message: 'Model parameter is required' },
        { status: 400 }
      );
    }

    const apiUrl = process.env.VOICEOVER_API_URL || 'http://localhost:8000';
    let apiUrlStr = `${apiUrl}/api/v1/audio/voices?model=${encodeURIComponent(modelParam)}`;
    if (limitParam) apiUrlStr += `&limit=${encodeURIComponent(limitParam)}`;
    if (offsetParam) apiUrlStr += `&offset=${encodeURIComponent(offsetParam)}`;
    if (searchSearchParam) apiUrlStr += `&search=${encodeURIComponent(searchSearchParam)}`;

    const response = await fetch(apiUrlStr, {
      next: { revalidate: 60 }
    });
    
    if (!response.ok) {
      throw new Error(`Backend API returned ${response.status}`);
    }
    
    const data = await response.json();
    
    // Check if it's the expected success format, if not, fallback empty
    if (data.status === 'success' && Array.isArray(data.voices)) {
      // Return just the array of voices to match existing UI expectations, or pass the full response
      // For maximal compatibility with useVoiceSamples, we return the array directly if it expects an array
      // wait, `getVoiceSamples` in frontend usually expects an array of VoiceSample. Let's see what `voiceoverApi.ts` expects.
      // Assuming we pass the full JSON and the frontend hook processes it, or we transform it here.
      // Let's pass the raw JSON, the new API has `{"status": "success", "voices": [...]}`
      return NextResponse.json(data);
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching TTS voices:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to fetch available voices' },
      { status: 500 }
    );
  }
}
