export function isDatabaseEnabled(): boolean {
  const envVal = process.env.NEXT_PUBLIC_ENABLE_DATABASE;
  if (envVal === 'false' || envVal === '0') {
    return false;
  }
  if (envVal === 'true' || envVal === '1') {
    return true;
  }
  // Server-side check
  if (typeof window === 'undefined') {
    return Boolean(process.env.DATABASE_URL || process.env.POSTGRES_URL);
  }
  return false;
}
