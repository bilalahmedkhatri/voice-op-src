import { NextRequest, NextResponse } from 'next/server';
import { getAvailableReplicateVoices, getAllLocalVoices } from '@/app/lib/replicateService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const modelParam = searchParams.get('model');

    // 1. Check if Replicate is selected via query param or runtime config
    let useReplicate = modelParam === 'kokoro-replicate';

    if (!modelParam) {
      try {
        const configResponse = await fetch(`${request.nextUrl.origin}/api/voiceover/config`);
        if (configResponse.ok) {
          const config = await configResponse.json();
          useReplicate = !!config.useReplicate;
        }
      } catch {
        useReplicate = false;
      }
    }

    // 2. If Replicate Mode is active, return the 32 curated Replicate voices
    if (useReplicate) {
      const replicateVoices = getAvailableReplicateVoices();
      return NextResponse.json(replicateVoices);
    }

    // 3. If Local Gateway Mode (localhost:8000) is active, return all 54 voices
    const allLocalVoices = getAllLocalVoices();
    return NextResponse.json(allLocalVoices);
  } catch (error) {
    const fallbackVoices = getAllLocalVoices();
    return NextResponse.json(fallbackVoices);
  }
}
