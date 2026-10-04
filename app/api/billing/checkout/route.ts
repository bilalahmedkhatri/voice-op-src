import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/lib/auth/googleAuth';
import { TOPUP_PACKAGES, PAYFAST_CONFIG, generateOrderId } from '@/app/lib/payments/payfast';
import { addCredits } from '@/app/lib/credits';

// POST /api/billing/checkout - Initiate a top-up checkout session (PayFast / Sandbox)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized: Please sign in to top up your wallet.' },
        { status: 401 }
      );
    }

    const host = request.headers.get('host') || '';
    const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');

    if (!isLocalhost) {
      return NextResponse.json(
        { error: 'Payments are currently disabled during the public testing phase. If you need more credits, please request them by emailing bilalahmed_bhabma@outlook.com' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { packageId, simulateSuccess } = body;

    if (!packageId || (packageId !== 'starter' && packageId !== 'pro')) {
      return NextResponse.json(
        { error: 'Invalid packageId. Must be "starter" ($10) or "pro" ($30).' },
        { status: 400 }
      );
    }

    const pkgKey = packageId as 'starter' | 'pro';
    const selectedPackage = TOPUP_PACKAGES[pkgKey];
    const orderId = generateOrderId(user.id, pkgKey);

    // DEV / SANDBOX SIMULATION FLOW:
    // If simulateSuccess is true (for developer testing or local sandbox demonstration),
    // atomically add credits immediately and return success!
    if (simulateSuccess || process.env.NODE_ENV !== 'production' && body.isTest) {
      const result = await addCredits(user.id, selectedPackage.credits, selectedPackage.tier, {
        actionType: packageId === 'starter' ? 'topup_starter' : 'topup_pro',
        description: `${selectedPackage.name} ($${selectedPackage.priceUsd} USD / ~${selectedPackage.pricePkr} PKR)`,
        referenceId: orderId,
        metadata: {
          packageId,
          priceUsd: selectedPackage.priceUsd,
          pricePkr: selectedPackage.pricePkr,
          paymentGateway: 'PayFast / Swich (Sandbox)',
          orderId,
        },
      });

      return NextResponse.json({
        status: 'success',
        simulated: true,
        orderId,
        creditsAdded: selectedPackage.credits,
        newBalance: result.balanceAfter,
        newTier: result.newTier,
        message: `Successfully topped up ${selectedPackage.credits} Credits (${selectedPackage.name})!`,
      });
    }

    // LIVE / GATEWAY REDIRECT FLOW (PayFast / Swich API):
    // In production with PayFast Merchant credentials:
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const callbackUrl = `${baseUrl}/api/billing/webhook`;
    const returnUrl = `${baseUrl}/settings?topup=success&orderId=${orderId}`;

    return NextResponse.json({
      status: 'pending',
      orderId,
      package: selectedPackage,
      merchantId: PAYFAST_CONFIG.merchantId,
      currency: 'PKR',
      amount: selectedPackage.pricePkr,
      amountUsd: selectedPackage.priceUsd,
      customerEmail: user.email,
      customerName: user.name || 'Valued Creator',
      callbackUrl,
      returnUrl,
      paymentGateway: 'PayFast (gopayfast.com)',
    });
  } catch (error: any) {
    console.error('Error initiating checkout:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to initiate checkout.' },
      { status: 500 }
    );
  }
}
