import { NextRequest, NextResponse } from 'next/server';
import { requireUser, requireId, requireOwnedTemplateItem, ownershipErrorResponse } from '@/app/lib/auth/ownership';
import { requireOwnedAudioJob } from '@/app/lib/audioJobs';
import { linkOwnedAudioJob } from '@/app/lib/audioJobLinks';

export async function POST(request: NextRequest) {
  try {
    const context = await requireUser();
    const body = await request.json();
    const jobId = requireId(body.jobId, 'Job ID');
    await requireOwnedTemplateItem(context, body.templateId, body.itemId);
    const job = await requireOwnedAudioJob(context, jobId);
    const audioRecord = await linkOwnedAudioJob(context, body.templateId, body.itemId, job);
    return NextResponse.json({ success: true, audioRecord });
  } catch (error) { return ownershipErrorResponse(error); }
}
export const PUT = POST;
