export function isDatabaseEnabled(): boolean {
  const envVal = process.env.NEXT_PUBLIC_ENABLE_DATABASE;
  if (envVal === 'false' || envVal === '0') {
    return false;
  }
  // If explicitly true, or if DATABASE_URL exists and not explicitly disabled
  if (envVal === 'true' || envVal === '1') {
    return true;
  }
  // Auto-detect based on DATABASE_URL presence
  return Boolean(process.env.DATABASE_URL || process.env.POSTGRES_URL);
}
