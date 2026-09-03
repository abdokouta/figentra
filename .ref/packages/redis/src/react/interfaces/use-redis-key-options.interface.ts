/**
 * @file use-redis-key-options.interface.ts
 * @module @stackra/redis/src/interfaces
 * @description IUseRedisKeyOptions interface.
 */

/**
 * Options for the useRedisKey hook.
 */
export interface IUseRedisKeyOptions {
  /** Polling interval in milliseconds. Default: 5000. */
  interval?: number;

  /** Connection name. Omit for default. */
  connection?: string;

  /** Whether polling is enabled. Default: true. */
  enabled?: boolean;
}
