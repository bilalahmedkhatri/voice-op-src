import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/lib/auth/googleAuth';
import { getDb } from '@/app/lib/db';
import { isDatabaseEnabled } from '@/app/lib/config';

// GET /api/billing/history - Fetch user's complete credit ledger, deposits, and usage summary
export async function GET(request: NextRequest) {
  if (!isDatabaseEnabled()) {
    return NextResponse.json({
      authenticated: false,
      available_credits: 50,
      tier: 'free',
      total_deposited: 50,
      total_spent: 0,
      history: [],
    });
  }

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized: Please sign in to view billing history.' },
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

    // 1. Fetch user's current profile wallet state
    const userRows = await sql`
      SELECT id, email, name, available_credits, tier, created_at
      FROM users
      WHERE id = ${user.id}
      LIMIT 1
    `;

    const userData = userRows[0] || user;
    const available_credits = Number(userData.available_credits ?? 50);
    const tier = userData.tier ?? 'free';

    // 2. Fetch ledger history
    const historyRows = await sql`
      SELECT id, amount, balance_after, action_type, description, reference_id, metadata, created_at
      FROM credit_history
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
      LIMIT 100
    `;

    // 3. Compute totals
    let totalDeposited = 0;
    let totalSpent = 0;

    for (const row of historyRows) {
      const amt = Number(row.amount);
      if (amt > 0) {
        totalDeposited += amt;
      } else {
        totalSpent += Math.abs(amt);
      }
    }

    return NextResponse.json({
      authenticated: true,
      available_credits,
      tier,
      total_deposited: totalDeposited,
      total_spent: totalSpent,
      history: historyRows || [],
    });
  } catch (error: any) {
    console.error('Error fetching billing history:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch billing history.' },
      { status: 500 }
    );
  }
}
