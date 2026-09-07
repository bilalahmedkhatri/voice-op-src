import { neon, NeonQueryFunction } from '@neondatabase/serverless';
import { isDatabaseEnabled } from '../config';

let sqlClient: NeonQueryFunction<false, false> | null = null;

export function getDb() {
  if (!isDatabaseEnabled()) {
    return null;
  }

  const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

  if (!databaseUrl) {
    return null;
  }

  if (!sqlClient) {
    sqlClient = neon(databaseUrl);
  }

  return sqlClient;
}

export async function executeQuery<T = any>(
  queryFn: (sql: NeonQueryFunction<false, false>) => Promise<T[]>
): Promise<T[] | null> {
  const sql = getDb();
  if (!sql) return null;
  try {
    return await queryFn(sql);
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}
