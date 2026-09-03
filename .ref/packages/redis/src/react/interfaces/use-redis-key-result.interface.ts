/**
 * @file use-redis-key-result.interface.ts
 * @module @stackra/redis/src/interfaces
 * @description IUseRedisKeyResult interface.
 */

/**
 * Result returned by the useRedisKey hook.
 */
export interface IUseRedisKeyResult {
  /** The current value of the key (null if absent, undefined if loading). */
  value: string | null | undefined;

  /** Whether the initial fetch is in progress. */
  loading: boolean;

  /** The last error encountered during fetch. */
  error: Error | null;

  /** Manually trigger a refresh. */
  refresh: () => Promise<void>;
}
