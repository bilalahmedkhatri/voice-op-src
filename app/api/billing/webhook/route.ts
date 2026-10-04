import { NextRequest, NextResponse } from 'next/server';
import { TOPUP_PACKAGES } from '@/app/lib/payments/payfast';
import { addCredits } from '@/app/lib/credits';
import { getDb } from '@/app/lib/db';

// POST /api/billing/webhook - Process incoming payment notifications from PayFast (gopayfast.com) or Swich (swichnow.io)
export async function POST(request: NextRequest) {
  try {
    let payload: any = {};
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      payload = await request.json();
    } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      formData.forEach((value, key) => {
        payload[key] = value.toString();
      });
    }

    // PayFast parameters typically include:
    // basket_id (e.g. GZ_STARTER_usr123_...), err_code ('000' or '00' = success), transaction_id, R_Amt
    const basketId = payload.basket_id || payload.order_id || payload.orderId || payload.BillReference;
    const errorCode = payload.err_code || payload.errorCode || payload.status;
    const transactionId = payload.transaction_id || payload.transactionId || payload.TransactionId || `txn_${Date.now()}`;

    // Verify success status ('000', '00', or 'success')
    const isSuccess =
      errorCode === '000' ||
      errorCode === '00' ||
      errorCode === 'success' ||
      errorCode === 'APPROVED' ||
      payload.payment_status === 'COMPLETE';

    if (!isSuccess) {
      console.warn('Payment failed or cancelled notification received:', payload);
      return NextResponse.json({ status: 'ignored', message: 'Payment was not approved' });
    }

    if (!basketId) {
      return NextResponse.json({ error: 'Missing basket_id / order_id in notification' }, { status: 400 });
    }

    // Parse package and user from basket_id (format: GZ_{PACKAGE}_{USERID}_{TIMESTAMP}_{RAND})
    // Or from custom metadata
    let packageId: 'starter' | 'pro' = 'starter';
    if (basketId.includes('PRO') || payload.package_id === 'pro') {
      packageId = 'pro';
    }

    let targetUserId = payload.user_id || payload.userId;
    if (!targetUserId && basketId.startsWith('GZ_')) {
      const parts = basketId.split('_');
      if (parts.length >= 3) {
        // Find user by matching short ID or email if provided
        const shortUser = parts[2];
        const sql = getDb();
        if (sql) {
          const userRows = await sql`
            SELECT id FROM users WHERE id LIKE ${'%' + shortUser + '%'} LIMIT 1
          `;
          if (userRows.length > 0) {
            targetUserId = userRows[0].id;
          }
        }
      }
    }

    if (!targetUserId) {
      return NextResponse.json({ error: 'Could not resolve user_id for this transaction' }, { status: 400 });
    }

    const sql = getDb();
    if (sql) {
      const existing = await sql`
        SELECT id, balance_after FROM credit_history
        WHERE reference_id = ${transactionId} OR reference_id = ${basketId}
        LIMIT 1;
      `;
      if (existing.length > 0) {
        console.log(`ℹ️ [IDEMPOTENCY] Transaction ${transactionId} / ${basketId} already processed. Skipping.`);
        return NextResponse.json({
          status: 'already_processed',
          message: 'Transaction has already been credited to user.',
          balance: existing[0].balance_after,
        });
      }
    }

    const selectedPackage = TOPUP_PACKAGES[packageId];

    // Atomically increment credits and upgrade tier in database
    const result = await addCredits(targetUserId, selectedPackage.credits, selectedPackage.tier, {
      actionType: packageId === 'starter' ? 'topup_starter' : 'topup_pro',
      description: `${selectedPackage.name} via PayFast / Swich (${transactionId})`,
      referenceId: transactionId,
      metadata: {
        basketId,
        transactionId,
        paymentGateway: 'PayFast / Swich IPN',
        payload,
      },
    });

    console.log(`✅ [PAYMENT SUCCESS] User ${targetUserId} topped up +${selectedPackage.credits} Credits. New Balance: ${result.balanceAfter}`);

    return NextResponse.json({
      status: 'success',
      message: 'Credits allocated successfully',
      creditsAdded: selectedPackage.credits,
      newBalance: result.balanceAfter,
      tier: result.newTier,
    });
  } catch (error: any) {
    console.error('Error processing billing webhook:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error in webhook handler' },
      { status: 500 }
    );
  }
}
