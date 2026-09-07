import { NextResponse } from 'next/server';
import { invalidateSession } from '@/app/lib/auth/googleAuth';

export async function POST() {
  await invalidateSession();
  return NextResponse.json({ success: true, message: 'Logged out successfully' });
}
