import { NextRequest, NextResponse } from 'next/server';
import { requireUser, requireId, ownershipErrorResponse } from '@/app/lib/auth/ownership';
import { getGuestOwner, verifyGuestJobToken } from '@/app/lib/auth/guestOwner';
import { requireOwnedAudioJob, retryAudioJob } from '@/app/lib/audioJobs';
import { isDatabaseEnabled } from '@/app/lib/config';

export async function POST(request: NextRequest) {
  try {
    const jobId = requireId((await request.json()).jobId, 'Job ID');
    if (isDatabaseEnabled()) {
      await requireOwnedAudioJob(await requireUser(), jobId);
    } else {
      verifyGuestJobToken(request.headers.get('X-Voice-Job-Token'), await getGuestOwner(), jobId);
    }
    return NextResponse.json(await retryAudioJob(jobId), { status: 202 });
  } catch (error) { return ownershipErrorResponse(error); }
}
