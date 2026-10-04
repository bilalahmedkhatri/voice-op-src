export interface TopupPackage {
  id: 'starter' | 'pro';
  name: string;
  priceUsd: number;
  pricePkr: number;
  credits: number;
  tier: 'starter' | 'pro';
  reelsCapability: number;
  metaAccounts: number;
  badge?: string;
  features: string[];
}

export const TOPUP_PACKAGES: Record<'starter' | 'pro', TopupPackage> = {
  starter: {
    id: 'starter',
    name: 'Starter Top-Up',
    priceUsd: 10,
    pricePkr: 2800,
    credits: 700,
    tier: 'starter',
    reelsCapability: 140,
    metaAccounts: 3,
    features: [
      '700 Non-expiring Credits',
      'Enough for 140 Full Automated Reels',
      'Link up to 3 Meta (Facebook & Instagram) Accounts',
      'Standard Gemini & Fish Audio Synthesis',
      'Full 75-Day Advance Meta Scheduling',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro Top-Up',
    priceUsd: 30,
    pricePkr: 8400,
    credits: 2200,
    tier: 'pro',
    reelsCapability: 440,
    metaAccounts: 10,
    badge: 'Best Value (+100 Bonus Credits)',
    features: [
      '2,200 Non-expiring Credits (Bonus Included)',
      'Enough for 440 Full Automated Reels',
      'Premium Voices (ElevenLabs) Unlocked',
      'Link up to 10 Meta (Facebook & Instagram) Accounts',
      'Bulk Scheduling & Priority Rendering',
    ],
  },
};

/**
 * PayFast configuration and endpoints (gopayfast.com)
 */
export const PAYFAST_CONFIG = {
  merchantId: process.env.PAYFAST_MERCHANT_ID || '10001', // Default sandbox merchant
  securedKey: process.env.PAYFAST_SECURED_KEY || 'sandbox_secret_key',
  mode: process.env.PAYFAST_MODE || 'sandbox', // 'sandbox' | 'live'
  sandboxUrl: 'https://ipguat.apps.net.pk/Ecommerce/api/Transaction/GetAccessToken',
  liveUrl: 'https://ipg.apps.net.pk/Ecommerce/api/Transaction/GetAccessToken',
  checkoutUrl: (token: string, mode: string = 'sandbox') =>
    mode === 'live'
      ? `https://ipg.apps.net.pk/Ecommerce/api/Transaction/PostTransaction?token=${token}`
      : `https://ipguat.apps.net.pk/Ecommerce/api/Transaction/PostTransaction?token=${token}`,
};

/**
 * Generate a unique basket/order ID for payment tracking
 */
export function generateOrderId(userId: string, packageId: string): string {
  const shortUser = userId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
  const timestamp = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 6);
  return `GZ_${packageId.toUpperCase()}_${shortUser}_${timestamp}_${rand}`;
}
