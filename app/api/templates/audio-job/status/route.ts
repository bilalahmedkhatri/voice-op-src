import { NextRequest, NextResponse } from 'next/server';
import { requireUser, requireId, ownershipErrorResponse } from '@/app/lib/auth/ownership';
import { getGuestOwner, verifyGuestJobToken } from '@/app/lib/auth/guestOwner';
import { fetchAudioJobStatus, syncOwnedAudioJob } from '@/app/lib/audioJobs';
import { isDatabaseEnabled } from '@/app/lib/config';

export async function GET(request: NextRequest) {
  try {
    const jobId = requireId(request.nextUrl.searchParams.get('jobId'), 'Job ID');
    if (isDatabaseEnabled()) return NextResponse.json(await syncOwnedAudioJob(await requireUser(), jobId));
    const owner = await getGuestOwner();
    verifyGuestJobToken(request.headers.get('X-Voice-Job-Token'), owner, jobId);
    return NextResponse.json(await fetchAudioJobStatus(jobId));
  } catch (error) { return ownershipErrorResponse(error); }
}
