import type {Copy} from './copy';

/** Presentation only: API codes and original error records remain unchanged. */
export function errorCopy(source: string | null | undefined, copy: Copy): string {
  if (!source) return '';
  if (/INSUFFICIENT_CREDITS|insufficient credits/i.test(source)) return copy('You do not have enough credits. Please top up your wallet.');
  if (/ACCOUNT_IDENTITY_CHANGED|Account identity changed/i.test(source)) return copy('Your account changed. Please reload the page.');
  if (/unauthorized|authentication required|not authenticated/i.test(source)) return copy('Please sign in to continue.');
  if (copy.has(source)) return copy(source);
  if (copy.recognizes(source)) return source;
  return copy('Something went wrong. Please try again.');
}
