import { getDb } from './db';
import { isDatabaseEnabled } from './config';

export type ActionType =
  | 'caption_generation'
  | 'standard_voiceover'
  | 'premium_voiceover'
  | 'social_schedule'
  | 'full_automation'
  | 'welcome_bonus'
  | 'topup_starter'
  | 'topup_pro'
  | 'admin_adjustment';

export type UserTier = 'free' | 'starter' | 'pro';

// Deduction rules per Price_Planning.md:
// Caption & Hashtags = 1 Credit ($0.015)
// Standard Voiceover (Gemini/Fish) = 2 Credits ($0.030)
// Premium Voiceover (ElevenLabs) = 4 Credits ($0.060)
// Social Media Scheduling (Meta) = 1 Credit ($0.015)
// FULL 1-CLICK AUTOMATION = 5 Credits ($0.075)
export const ACTION_CREDIT_COSTS: Record<ActionType, number> = {
  caption_generation: 1,
  standard_voiceover: 2,
  premium_voiceover: 4,
  social_schedule: 1,
  full_automation: 5,
  welcome_bonus: 0,
  topup_starter: 0,
  topup_pro: 0,
  admin_adjustment: 0,
};

export const TIER_LIMITS: Record<UserTier, { maxMetaAccounts: number; label: string }> = {
  free: {
    maxMetaAccounts: 1,
    label: 'Free Tier',
  },
  starter: {
    maxMetaAccounts: 3,
    label: 'Starter ($10)',
  },
  pro: {
    maxMetaAccounts: 10,
    label: 'Pro ($30)',
  },
};

export interface WalletState {
  availableCredits: number;
  tier: UserTier;
}

export interface VerificationResult {
  ok: boolean;
  requiredCredits: number;
  availableCredits: number;
  tier: UserTier;
  error?: string;
  code?: 'INSUFFICIENT_CREDITS' | 'TIER_RESTRICTED' | 'UNAUTHENTICATED' | 'DB_UNAVAILABLE';
}

/**
 * Fetch a user's current wallet balance and tier from Neon DB.
 */
export async function getUserWallet(userId: string): Promise<WalletState> {
  const sql = getDb();
  if (!sql) {
    return { availableCredits: 50, tier: 'free' };
  }

  const rows = await sql`
    SELECT available_credits, tier 
    FROM users 
    WHERE id = ${userId} 
    LIMIT 1
  `;

  if (!rows || rows.length === 0) {
    return { availableCredits: 0, tier: 'free' };
  }

  return {
    availableCredits: Number(rows[0].available_credits ?? 0),
    tier: (rows[0].tier as UserTier) || 'free',
  };
}

/**
 * Verify if the user has sufficient credits before executing an API action.
 */
export async function verifyCreditBalance(
  userId: string,
  actionType: ActionType,
  customAmount?: number
): Promise<VerificationResult> {
  if (!isDatabaseEnabled()) {
    return {
      ok: true,
      requiredCredits: customAmount !== undefined ? customAmount : (ACTION_CREDIT_COSTS[actionType] || 0),
      availableCredits: 999,
      tier: 'pro',
    };
  }

  const wallet = await getUserWallet(userId);
  const requiredCredits = customAmount !== undefined ? customAmount : (ACTION_CREDIT_COSTS[actionType] || 0);

  // Check 1: Premium Voiceover (ElevenLabs) tier check
  if (actionType === 'premium_voiceover' && wallet.tier === 'free' && wallet.availableCredits < requiredCredits) {
    return {
      ok: false,
      requiredCredits,
      availableCredits: wallet.availableCredits,
      tier: wallet.tier,
      code: 'TIER_RESTRICTED',
      error: `ElevenLabs premium voice requires at least ${requiredCredits} credits. Please top up your wallet.`,
    };
  }

  // Check 2: Balance check
  if (wallet.availableCredits < requiredCredits) {
    return {
      ok: false,
      requiredCredits,
      availableCredits: wallet.availableCredits,
      tier: wallet.tier,
      code: 'INSUFFICIENT_CREDITS',
      error: `Insufficient credits. You need ${requiredCredits} credit${requiredCredits > 1 ? 's' : ''}, but have ${wallet.availableCredits}. Please top up to proceed.`,
    };
  }

  return {
    ok: true,
    requiredCredits,
    availableCredits: wallet.availableCredits,
    tier: wallet.tier,
  };
}

/**
 * Atomically deduct credits from user's wallet and log transaction in credit_history ledger.
 */
export async function deductCredits(
  userId: string,
  actionType: ActionType,
  options: {
    description?: string;
    referenceId?: string | null;
    metadata?: Record<string, any>;
    customAmount?: number;
  } = {}
): Promise<{ success: boolean; balanceAfter: number; creditsDeducted: number }> {
  const requiredCredits = options.customAmount !== undefined ? options.customAmount : (ACTION_CREDIT_COSTS[actionType] || 0);

  if (!isDatabaseEnabled()) {
    return { success: true, balanceAfter: 999, creditsDeducted: requiredCredits };
  }

  const sql = getDb();
  if (!sql) {
    throw new Error('Database is not available for credit deduction.');
  }

  if (requiredCredits <= 0) {
    const wallet = await getUserWallet(userId);
    return { success: true, balanceAfter: wallet.availableCredits, creditsDeducted: 0 };
  }

  // Atomic deduction: only updates if available_credits >= requiredCredits
  const updateResult = await sql`
    UPDATE users
    SET available_credits = available_credits - ${requiredCredits},
        updated_at = NOW()
    WHERE id = ${userId} AND available_credits >= ${requiredCredits}
    RETURNING available_credits, tier
  `;

  if (!updateResult || updateResult.length === 0) {
    throw new Error('INSUFFICIENT_CREDITS');
  }

  const balanceAfter = Number(updateResult[0].available_credits);

  // Default description
  const defaultDescriptions: Record<ActionType, string> = {
    caption_generation: 'AI Caption & Hashtags Generation',
    standard_voiceover: 'Standard Voiceover (Gemini / Fish Audio)',
    premium_voiceover: 'Premium Voiceover (ElevenLabs)',
    social_schedule: 'Meta Post / Reel Scheduling',
    full_automation: 'Full 1-Click Automated Reel Pipeline',
    welcome_bonus: 'Welcome Bonus',
    topup_starter: 'Starter Top-Up ($10)',
    topup_pro: 'Pro Top-Up ($30)',
    admin_adjustment: 'Admin Credit Adjustment',
  };

  const finalDescription = options.description || defaultDescriptions[actionType] || 'Credit Deduction';
  const historyId = `crd_${crypto.randomUUID().replace(/-/g, '')}`;

  try {
    await sql`
      INSERT INTO credit_history (
        id, user_id, amount, balance_after, action_type, description, reference_id, metadata, created_at
      ) VALUES (
        ${historyId},
        ${userId},
        ${-requiredCredits},
        ${balanceAfter},
        ${actionType},
        ${finalDescription},
        ${options.referenceId || null},
        ${JSON.stringify(options.metadata || {})}::jsonb,
        NOW()
      )
    `;
  } catch (logErr) {
    console.error('Warning: Failed to log credit_history entry:', logErr);
  }

  return {
    success: true,
    balanceAfter,
    creditsDeducted: requiredCredits,
  };
}

/**
 * Add credits to user wallet (e.g. from PayFast / Swich top-up or bonus) and record ledger entry.
 */
export async function addCredits(
  userId: string,
  amount: number,
  tierUpgrade?: UserTier,
  options: {
    actionType?: ActionType;
    description?: string;
    referenceId?: string | null;
    metadata?: Record<string, any>;
  } = {}
): Promise<{ success: boolean; balanceAfter: number; newTier: UserTier; creditsAdded: number }> {
  const sql = getDb();
  if (!sql) {
    throw new Error('Database is not available for adding credits.');
  }

  const updateResult = await sql`
    UPDATE users
    SET available_credits = available_credits + ${amount},
        tier = CASE 
          WHEN ${tierUpgrade || null}::varchar IS NOT NULL THEN ${tierUpgrade}::varchar
          ELSE tier 
        END,
        updated_at = NOW()
    WHERE id = ${userId}
    RETURNING available_credits, tier
  `;

  if (!updateResult || updateResult.length === 0) {
    throw new Error('User not found to add credits.');
  }

  const balanceAfter = Number(updateResult[0].available_credits);
  const newTier = (updateResult[0].tier as UserTier) || 'free';

  const actionType = options.actionType || (amount === 700 ? 'topup_starter' : amount === 2200 ? 'topup_pro' : 'admin_adjustment');
  const description = options.description || `Wallet Top-Up (+${amount} Credits)`;
  const historyId = `crd_${crypto.randomUUID().replace(/-/g, '')}`;

  try {
    await sql`
      INSERT INTO credit_history (
        id, user_id, amount, balance_after, action_type, description, reference_id, metadata, created_at
      ) VALUES (
        ${historyId},
        ${userId},
        ${amount},
        ${balanceAfter},
        ${actionType},
        ${description},
        ${options.referenceId || null},
        ${JSON.stringify(options.metadata || {})}::jsonb,
        NOW()
      )
    `;
  } catch (logErr) {
    console.error('Warning: Failed to log credit_history top-up entry:', logErr);
  }

  return {
    success: true,
    balanceAfter,
    newTier,
    creditsAdded: amount,
  };
}

/**
 * Check if the user is allowed to connect another Meta (Facebook/Instagram) page based on their tier.
 */
export async function checkMetaAccountLimit(
  userId: string,
  targetPageId?: string
): Promise<{ allowed: boolean; currentCount: number; maxAllowed: number; tier: UserTier; error?: string }> {
  const sql = getDb();
  if (!sql) {
    return { allowed: true, currentCount: 0, maxAllowed: 10, tier: 'pro' };
  }

  const wallet = await getUserWallet(userId);
  const maxAllowed = TIER_LIMITS[wallet.tier]?.maxMetaAccounts || 1;

  // Count existing active pages excluding the one being updated (if updating)
  const countRows = await sql`
    SELECT COUNT(*) as count 
    FROM facebook_pages 
    WHERE user_id = ${userId} 
      AND (${targetPageId || null}::text IS NULL OR page_id != ${targetPageId})
  `;

  const currentCount = Number(countRows[0]?.count || 0);

  if (currentCount >= maxAllowed) {
    return {
      allowed: false,
      currentCount,
      maxAllowed,
      tier: wallet.tier,
      error: `Your current ${TIER_LIMITS[wallet.tier].label} allows linking up to ${maxAllowed} Meta account${maxAllowed > 1 ? 's' : ''}. Please top up to Starter (3 accounts) or Pro (10 accounts) to link more pages.`,
    };
  }

  return {
    allowed: true,
    currentCount,
    maxAllowed,
    tier: wallet.tier,
  };
}
