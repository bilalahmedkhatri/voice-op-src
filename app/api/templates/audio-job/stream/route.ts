import { NextRequest, NextResponse } from 'next/server';
import { requireUser, requireId, OwnershipError, ownershipErrorResponse } from '@/app/lib/auth/ownership';
import { getGuestOwner, verifyGuestJobToken } from '@/app/lib/auth/guestOwner';
import { requireOwnedAudioJob } from '@/app/lib/audioJobs';
import { gatewayHeaders } from '@/app/lib/gatewayHeaders';
import { isDatabaseEnabled } from '@/app/lib/config';

export const maxDuration = 300;

export async function GET(request: NextRequest) {
  try {
    const jobId = requireId(request.nextUrl.searchParams.get('jobId'), 'Job ID');
    const after = Number(request.nextUrl.searchParams.get('after') || '0');
    if (!Number.isSafeInteger(after) || after < 0) throw new OwnershipError('Invalid chunk index.', 400);
    if (isDatabaseEnabled()) await requireOwnedAudioJob(await requireUser(), jobId);
    else verifyGuestJobToken(request.headers.get('X-Voice-Job-Token'), await getGuestOwner(), jobId);
    const base = process.env.VOICEOVER_API_URL || 'http://localhost:8000';
    const response = await fetch(`${base}/api/v1/audio/tts/stream/${encodeURIComponent(jobId)}?after=${after}`, {
      headers: gatewayHeaders(), cache: 'no-store', signal: request.signal,
    });
    if (!response.ok || !response.body) throw new OwnershipError('Live preview is unavailable.', response.status === 404 ? 404 : 502);
    return new NextResponse(response.body, { headers: {
      'Content-Type': 'application/x-ndjson', 'Cache-Control': 'private, no-store', 'X-Accel-Buffering': 'no',
    } });
  } catch (error) { return ownershipErrorResponse(error); }
}
