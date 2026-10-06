import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

import { getDb } from '../app/lib/db';
import {
  TOPUP_PACKAGES,
  generateOrderId,
  PAYFAST_CONFIG,
} from '../app/lib/payments/payfast';
import {
  getUserWallet,
  addCredits,
  deductCredits,
  checkMetaAccountLimit,
} from '../app/lib/credits';

async function verifyPhase3() {
  const sql = getDb();
  if (!sql) {
    console.error('❌ Database connection failed');
    process.exit(1);
  }

  console.log('====================================================');
  console.log('🚀 GENZEE STUDIO — PHASE 3 MONETIZATION VERIFICATION');
  console.log('====================================================\n');

  console.log('--- 1. Testing Top-Up Package Configurations ---');
  console.log('Starter Package:', TOPUP_PACKAGES.starter);
  console.log('Pro Package:', TOPUP_PACKAGES.pro);

  if (TOPUP_PACKAGES.starter.credits !== 700 || TOPUP_PACKAGES.starter.priceUsd !== 10) {
    throw new Error('Starter package configuration invalid');
  }
  if (TOPUP_PACKAGES.pro.credits !== 2200 || TOPUP_PACKAGES.pro.priceUsd !== 30) {
    throw new Error('Pro package configuration invalid');
  }
  console.log('✅ Package pricing and credit ratios verified!\n');

  console.log('--- 2. Testing PayFast / Swich Order Reference Generator ---');
  const sampleUserId = 'usr_test_12345678';
  const starterOrderId = generateOrderId(sampleUserId, 'starter');
  const proOrderId = generateOrderId(sampleUserId, 'pro');
  console.log('Generated Starter Basket ID:', starterOrderId);
  console.log('Generated Pro Basket ID:', proOrderId);

  if (!starterOrderId.startsWith('GZ_STARTER_') || !proOrderId.startsWith('GZ_PRO_')) {
    throw new Error('Invalid basket order ID prefix format');
  }
  console.log('✅ Order reference format conforms to PayFast / Swich merchant specifications!\n');

  console.log('--- 3. Fetching Test User from Database ---');
  const userRows = await sql`
    SELECT id, email, available_credits, tier 
    FROM users 
    LIMIT 1;
  `;

  if (userRows.length === 0) {
    console.error('❌ No user found in database to test.');
    process.exit(1);
  }

  const testUser = userRows[0];
  const initialCredits = Number(testUser.available_credits);
  const initialTier = testUser.tier;
  console.log(`User: ${testUser.email} (ID: ${testUser.id})`);
  console.log(`Original Balance: ${initialCredits} Credits | Original Tier: ${initialTier}\n`);

  console.log('--- 4. Testing Starter Top-Up Simulation ($10 / +700 Credits) ---');
  const starterTopUp = await addCredits(testUser.id, TOPUP_PACKAGES.starter.credits, TOPUP_PACKAGES.starter.tier, {
    actionType: 'topup_starter',
    description: `${TOPUP_PACKAGES.starter.name} ($10 USD / ~2800 PKR)`,
    referenceId: starterOrderId,
    metadata: { test: true, packageId: 'starter', gateway: 'PayFast / Swich' },
  });

  console.log(`Topped up +${starterTopUp.creditsAdded} Credits. New Balance: ${starterTopUp.balanceAfter} | Tier: ${starterTopUp.newTier}`);
  if (starterTopUp.balanceAfter !== initialCredits + 700) {
    throw new Error(`Starter balance mismatch: Expected ${initialCredits + 700}, got ${starterTopUp.balanceAfter}`);
  }
  if (starterTopUp.newTier !== 'starter') {
    throw new Error(`Starter tier mismatch: Expected "starter", got "${starterTopUp.newTier}"`);
  }

  // Verify Starter Meta Account Limit
  const starterLimits = await checkMetaAccountLimit(testUser.id);
  console.log(`Starter Meta Limits: Max Allowed = ${starterLimits.maxAllowed} (Expected: 10)`);
  if (starterLimits.maxAllowed !== 10) {
    throw new Error(`Starter Meta limit mismatch: Expected 10, got ${starterLimits.maxAllowed}`);
  }
  console.log('✅ Starter Package Top-Up & Tier Upgrade Verified!\n');

  console.log('--- 5. Testing Pro Top-Up Simulation ($30 / +2,200 Credits) ---');
  const proTopUp = await addCredits(testUser.id, TOPUP_PACKAGES.pro.credits, TOPUP_PACKAGES.pro.tier, {
    actionType: 'topup_pro',
    description: `${TOPUP_PACKAGES.pro.name} ($30 USD / ~8400 PKR)`,
    referenceId: proOrderId,
    metadata: { test: true, packageId: 'pro', gateway: 'PayFast / Swich' },
  });

  console.log(`Topped up +${proTopUp.creditsAdded} Credits. New Balance: ${proTopUp.balanceAfter} | Tier: ${proTopUp.newTier}`);
  if (proTopUp.balanceAfter !== initialCredits + 700 + 2200) {
    throw new Error(`Pro balance mismatch: Expected ${initialCredits + 2900}, got ${proTopUp.balanceAfter}`);
  }
  if (proTopUp.newTier !== 'pro') {
    throw new Error(`Pro tier mismatch: Expected "pro", got "${proTopUp.newTier}"`);
  }

  // Verify Pro Meta Account Limit
  const proLimits = await checkMetaAccountLimit(testUser.id);
  console.log(`Pro Meta Limits: Max Allowed = ${proLimits.maxAllowed} (Expected: 50)`);
  if (proLimits.maxAllowed !== 50) {
    throw new Error(`Pro Meta limit mismatch: Expected 50, got ${proLimits.maxAllowed}`);
  }
  console.log('✅ Pro Package Top-Up & Tier Upgrade Verified!\n');

  console.log('--- 6. Verifying Credit History Ledger Records ---');
  const historyRows = await sql`
    SELECT id, amount, balance_after, action_type, description, reference_id, created_at
    FROM credit_history
    WHERE user_id = ${testUser.id}
    ORDER BY created_at DESC
    LIMIT 2;
  `;

  console.log('Latest 2 Ledger Transactions:');
  historyRows.forEach((row, i) => {
    console.log(`  [${i + 1}] Action: ${row.action_type} | Amount: +${row.amount} | Balance After: ${row.balance_after} | Ref: ${row.reference_id}`);
  });

  if (historyRows[0].action_type !== 'topup_pro' || historyRows[1].action_type !== 'topup_starter') {
    throw new Error('Ledger transaction action types do not match expected sequence');
  }
  console.log('✅ Ledger logging for PayFast / Swich top-ups verified!\n');

  console.log('--- 7. Restoring User Balance & Tier to Original State ---');
  // Revert credits and tier
  await sql`
    UPDATE users 
    SET available_credits = ${initialCredits}, tier = ${initialTier}
    WHERE id = ${testUser.id};
  `;

  // Clean test transactions from credit_history
  await sql`
    DELETE FROM credit_history 
    WHERE user_id = ${testUser.id} AND (reference_id = ${starterOrderId} OR reference_id = ${proOrderId});
  `;

  const restoredUser = await getUserWallet(testUser.id);
  console.log(`Restored User Balance: ${restoredUser.availableCredits} Credits | Tier: ${restoredUser.tier}`);
  if (restoredUser.availableCredits !== initialCredits || restoredUser.tier !== initialTier) {
    throw new Error('Failed to restore original user state cleanly');
  }
  console.log('✅ User test data cleaned and restored cleanly!\n');

  console.log('====================================================');
  console.log('🎉 ALL PHASE 3 VERIFICATION TESTS PASSED 100%!');
  console.log('====================================================');
}

verifyPhase3().catch((err) => {
  console.error('❌ Phase 3 Verification failed:', err);
  process.exit(1);
});
