import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/lib/auth/googleAuth';
import { getDb } from '@/app/lib/db';
import { isDatabaseEnabled } from '@/app/lib/config';

// GET /api/billing/status/[orderId] - Query if a PayFast/Swich order has been confirmed and credited
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;

  if (!orderId) {
    return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
  }

  if (!isDatabaseEnabled()) {
    return NextResponse.json({ status: 'simulated', credited: true });
  }

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sql = getDb();
    if (!sql) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    // Check if this referenceId exists in credit_history for this user
    const rows = await sql`
      SELECT id, amount, balance_after, action_type, description, reference_id, created_at
      FROM credit_history
      WHERE user_id = ${user.id} AND reference_id = ${orderId}
      LIMIT 1
    `;

    if (rows.length > 0) {
      return NextResponse.json({
        credited: true,
        transaction: rows[0],
        message: 'Order has been credited to your wallet.',
      });
    }

    return NextResponse.json({
      credited: false,
      message: 'Order is pending or not yet confirmed by the payment gateway.',
    });
  } catch (error: any) {
    console.error('Error checking order status:', error);
    return NextResponse.json({ error: 'Failed to check order status' }, { status: 500 });
  }
}
