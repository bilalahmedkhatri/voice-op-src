import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiUrl = process.env.VOICEOVER_API_URL || 'http://localhost:8000';
    const response = await fetch(`${apiUrl}/api/v1/audio/models`, {
      next: { revalidate: 60 } // Cache for 60 seconds
    });
    
    if (!response.ok) {
      throw new Error(`Backend API returned ${response.status}`);
    }
    
    const data = await response.json();
    if (data.models && Array.isArray(data.models)) {
      data.models = data.models.filter(
        (m: { name?: string; is_local?: boolean }) => !m.is_local && m.name !== 'kokoro-v1.0-local'
      );
      data.count = data.models.length;
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching TTS models:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to fetch available models' },
      { status: 500 }
    );
  }
}
