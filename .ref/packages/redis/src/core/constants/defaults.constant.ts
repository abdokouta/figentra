/**
 * @file defaults.constant.ts
 * @module @stackra/ts-redis/constants
 * @description Default configuration values for the Redis platform package.
 */

/** Default key prefix for cache store entries. */
export const DEFAULT_CACHE_PREFIX = 'cache:';

/** Default key prefix for tag sets. */
export const DEFAULT_TAG_PREFIX = 'tag:';

/** Default slow query threshold in milliseconds. */
export const DEFAULT_SLOW_QUERY_THRESHOLD = 100;

/** Default maximum reconnection retry attempts. */
export const DEFAULT_MAX_RETRIES = 3;

/** Default lock TTL in milliseconds. */
export const DEFAULT_LOCK_TTL = 10_000;

/** Default lock acquisition timeout in milliseconds. */
export const DEFAULT_LOCK_TIMEOUT = 5_000;

/** Default lock retry delay in milliseconds. */
export const DEFAULT_LOCK_RETRY_DELAY = 200;

/** Default limiter block timeout in seconds. */
export const DEFAULT_LIMITER_BLOCK_TIMEOUT = 3;

/** Default limiter sleep between retries in milliseconds. */
export const DEFAULT_LIMITER_SLEEP_MS = 250;
