import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');

  if (!jobId) {
    return NextResponse.json({ error: 'jobId is required' }, { status: 400 });
  }

  try {
    const apiUrl = process.env.VOICEOVER_API_URL || 'http://localhost:8000';
    const response = await fetch(`${apiUrl}/api/v1/audio/tts/status/${jobId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch job status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error polling audio job:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
