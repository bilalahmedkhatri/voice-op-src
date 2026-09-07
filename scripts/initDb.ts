import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';

// Load .env.local or .env
dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

async function initDatabase() {
  const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

  if (!databaseUrl) {
    console.error('❌ Error: DATABASE_URL is not found in .env.local');
    process.exit(1);
  }

  console.log('🔄 Connecting to Neon PostgreSQL...');
  const sql = neon(databaseUrl);

  const schemaPath = path.join(process.cwd(), 'app', 'lib', 'db', 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  console.log('🚀 Applying schema.sql (4 tables + indexes)...');

  // Strip single-line comments and split by semicolon
  const cleanSql = schemaSql.replace(/--.*$/gm, '');
  const statements = cleanSql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of statements) {
    try {
      console.log(`Executing: ${stmt.substring(0, 45).replace(/\n/g, ' ')}...`);
      // Neon 1.x supports sql.query(statement)
      await (sql as any).query(stmt);
    } catch (err: any) {
      console.error(`⚠️ Failed to execute statement:\n${stmt}\nError:`, err.message);
    }
  }

  // Verify tables from information_schema
  const tables = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `;

  console.log('🎉 SUCCESS! Tables present in Database:', tables.map((t: any) => t.table_name));
}

initDatabase().catch((err) => {
  console.error('❌ Initialization failed:', err);
  process.exit(1);
});
