import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

import { getDb } from '../app/lib/db';
import {
  getUserWallet,
  verifyCreditBalance,
  deductCredits,
  addCredits,
  checkMetaAccountLimit,
  ACTION_CREDIT_COSTS,
} from '../app/lib/credits';

async function verifyPhase2() {
  const sql = getDb();
  if (!sql) {
    console.error('❌ Database connection failed');
    process.exit(1);
  }

  console.log('--- 1. Fetching a test user for verification ---');
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
  console.log(`Test User: ${testUser.email} (ID: ${testUser.id})`);
  console.log(`Initial Balance: ${initialCredits} Credits | Tier: ${testUser.tier}`);

  console.log('\n--- 2. Testing Credit Verification Rules ---');
  const verifyStandard = await verifyCreditBalance(testUser.id, 'standard_voiceover');
  console.log('Standard Voiceover (2 credits):', verifyStandard.ok ? '✅ ALLOWED' : '❌ REJECTED');

  const verifyElevenLabs = await verifyCreditBalance(testUser.id, 'premium_voiceover');
  console.log('Premium Voiceover (4 credits):', verifyElevenLabs.ok ? '✅ ALLOWED' : '❌ REJECTED');

  const verifyAuto = await verifyCreditBalance(testUser.id, 'full_automation');
  console.log('Full Automation (5 credits):', verifyAuto.ok ? '✅ ALLOWED' : '❌ REJECTED');

  console.log('\n--- 3. Testing Atomic Credit Deduction ---');
  const deductAmount = 2; // standard_voiceover
  const deductResult = await deductCredits(testUser.id, 'standard_voiceover', {
    description: 'Test Verification Deduction (Standard Voiceover)',
    metadata: { test: true },
  });
  console.log(`Deducted ${deductResult.creditsDeducted} credits. New Balance: ${deductResult.balanceAfter}`);

  if (deductResult.balanceAfter !== initialCredits - deductAmount) {
    throw new Error(`Balance mismatch: Expected ${initialCredits - deductAmount}, got ${deductResult.balanceAfter}`);
  }
  console.log('✅ Atomic balance deduction verified successfully!');

  console.log('\n--- 4. Checking Credit History Ledger Entry ---');
  const ledgerRows = await sql`
    SELECT id, amount, balance_after, action_type, description, created_at
    FROM credit_history
    WHERE user_id = ${testUser.id}
    ORDER BY created_at DESC
    LIMIT 1;
  `;
  console.log('Latest Ledger Record:', ledgerRows[0]);
  if (Number(ledgerRows[0].amount) !== -deductAmount) {
    throw new Error(`Ledger amount mismatch: Expected -${deductAmount}, got ${ledgerRows[0].amount}`);
  }
  console.log('✅ Ledger logging verified successfully!');

  console.log('\n--- 5. Restoring User Balance via addCredits ---');
  const restoreResult = await addCredits(testUser.id, deductAmount, undefined, {
    actionType: 'admin_adjustment',
    description: 'Test Restoration (+2 Credits)',
    metadata: { test: true },
  });
  console.log(`Restored ${deductAmount} credits. Restored Balance: ${restoreResult.balanceAfter}`);
  if (restoreResult.balanceAfter !== initialCredits) {
    throw new Error(`Restore mismatch: Expected ${initialCredits}, got ${restoreResult.balanceAfter}`);
  }
  console.log('✅ Balance restoration verified successfully!');

  console.log('\n--- 6. Testing Meta Account Limit Checks ---');
  const metaLimitCheck = await checkMetaAccountLimit(testUser.id);
  console.log(`Meta Account Limits for Tier "${metaLimitCheck.tier}": Current ${metaLimitCheck.currentCount} / Max ${metaLimitCheck.maxAllowed}`);
  console.log('Allowed to link next page:', metaLimitCheck.allowed ? '✅ YES' : '❌ NO (Limit Reached)');

  console.log('\n🎉 ALL PHASE 2 VERIFICATIONS PASSED SUCCESSFULLY!');
}

verifyPhase2().catch((err) => {
  console.error('❌ Phase 2 Verification failed:', err);
  process.exit(1);
});
