import * as dotenv from 'dotenv';
import * as path from 'path';
import { neon } from '@neondatabase/serverless';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!dbUrl) {
  console.error('❌ Error: DATABASE_URL not found');
  process.exit(1);
}

const sql = neon(dbUrl);

async function runMigration() {
  console.log('🔄 Running migration for json_templates.user_id...');

  // 1. Add user_id column if not exists
  console.log('1. Adding user_id column...');
  await sql`
    ALTER TABLE json_templates 
    ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id) ON DELETE CASCADE;
  `;

  // 2. Populate user_id from updated_by for existing rows
  console.log('2. Populating user_id from updated_by...');
  await sql`
    UPDATE json_templates 
    SET user_id = updated_by 
    WHERE user_id IS NULL AND updated_by IS NOT NULL;
  `;

  // 3. Create index for fast user queries
  console.log('3. Creating index on (user_id, created_at DESC)...');
  await sql`
    CREATE INDEX IF NOT EXISTS idx_templates_user_date 
    ON json_templates(user_id, created_at DESC);
  `;

  // 4. Verify columns and count
  const cols = await sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'json_templates' AND column_name = 'user_id';
  `;
  console.log('✅ user_id column verified:', cols);

  const counts = await sql`
    SELECT count(*) as total, count(user_id) as with_user_id 
    FROM json_templates;
  `;
  console.log('📊 Templates count:', counts);

  console.log('🎉 Migration completed successfully!');
}

runMigration().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
