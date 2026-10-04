import * as path from 'path';
import * as dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

async function verifyPhase1() {
  const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL missing');
    process.exit(1);
  }

  const sql = neon(databaseUrl);

  console.log('--- 1. Checking columns in `users` table ---');
  const userColumns = await sql`
    SELECT column_name, data_type, column_default, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'users' AND column_name IN ('available_credits', 'tier')
    ORDER BY column_name;
  `;
  console.log(userColumns);

  console.log('\n--- 2. Checking `credit_history` table definition ---');
  const creditColumns = await sql`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'credit_history'
    ORDER BY ordinal_position;
  `;
  console.log(creditColumns);

  console.log('\n--- 3. Checking existing user balances in database ---');
  const sampleUsers = await sql`
    SELECT id, email, available_credits, tier, created_at
    FROM users
    LIMIT 5;
  `;
  console.log(sampleUsers);

  console.log('\n--- 4. Checking index on `credit_history` ---');
  const indexes = await sql`
    SELECT indexname, indexdef
    FROM pg_indexes
    WHERE tablename = 'credit_history';
  `;
  console.log(indexes);

  console.log('\n✅ Phase 1 Database Verification Complete!');
}

verifyPhase1().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
