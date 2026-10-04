import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/lib/auth/googleAuth';
import { getDb } from '@/app/lib/db';
import { isDatabaseEnabled } from '@/app/lib/config';

// GET /api/credits - Fetch authenticated user's current wallet balance, tier, and ledger history
export async function GET(request: NextRequest) {
  if (!isDatabaseEnabled()) {
    return NextResponse.json({
      authenticated: false,
      available_credits: 50,
      tier: 'free',
      history: [],
    });
  }

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized: Please sign in to view wallet credits.' },
        { status: 401 }
      );
    }

    const sql = getDb();
    if (!sql) {
      return NextResponse.json(
        { error: 'Database service is currently unavailable.' },
        { status: 503 }
      );
    }

    // Fetch user's current credits and tier directly
    const userRows = await sql`
      SELECT id, email, available_credits, tier 
      FROM users 
      WHERE id = ${user.id}
      LIMIT 1
    `;

    const userData = userRows[0] || user;
    const available_credits = userData.available_credits ?? 50;
    const tier = userData.tier ?? 'free';

    // Fetch user's credit ledger history
    const historyRows = await sql`
      SELECT id, amount, balance_after, action_type, description, reference_id, metadata, created_at
      FROM credit_history
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
      LIMIT 50
    `;

    return NextResponse.json({
      authenticated: true,
      available_credits,
      tier,
      history: historyRows || [],
    });
  } catch (error: any) {
    console.error('Error fetching credits data:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch wallet credits.' },
      { status: 500 }
    );
  }
}
