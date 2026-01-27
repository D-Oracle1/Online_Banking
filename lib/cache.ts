import { unstable_cache } from 'next/cache';

// Cache tags for revalidation
export const CACHE_TAGS = {
  USER: 'user',
  ACCOUNT: 'account',
  TRANSACTION: 'transaction',
  LOAN: 'loan',
  DEPOSIT: 'deposit',
  MESSAGE: 'message',
} as const;

// Cache durations (in seconds)
export const CACHE_DURATIONS = {
  SHORT: 30, // 30 seconds - for frequently changing data
  MEDIUM: 60, // 1 minute - for moderately changing data
  LONG: 300, // 5 minutes - for rarely changing data
} as const;

/**
 * Cached database query wrapper
 * @param fn - The function to cache
 * @param keyParts - Parts to create a unique cache key
 * @param tags - Cache tags for revalidation
 * @param revalidate - Revalidation time in seconds
 */
export function cachedQuery<T>(
  fn: () => Promise<T>,
  keyParts: string[],
  tags: string[],
  revalidate: number = CACHE_DURATIONS.SHORT
) {
  return unstable_cache(fn, keyParts, {
    tags,
    revalidate,
  });
}
