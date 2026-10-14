import { NextResponse } from 'next/server';

// Public payments are disabled. Do not accept caller-selected user IDs or success flags.
// Enable only after verified provider callbacks resolve a persisted, server-created order.
export async function POST() {
  return NextResponse.json({ error: 'Payment notifications are not enabled.' }, { status: 503 });
}
