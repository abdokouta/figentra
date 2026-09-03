/**
 * @file index.ts
 * @module @stackra/redis/react
 * @description React hooks for Redis consumption. Works on both web and
 *   React Native without platform-specific imports.
 *
 *   Import from `@stackra/redis/react` — not from the main entry.
 *
 * @example
 * ```tsx
 * import { useRedis, useRedisKey, useRedisHealth } from '@stackra/redis/react';
 * ```
 */

export { useRedis } from './use-redis';
export { useRedisManager } from './use-redis-manager';
export { useRedisKey } from './use-redis-key';
export type { IUseRedisKeyOptions, IUseRedisKeyResult } from './use-redis-key';
export { useRedisHealth } from './use-redis-health';
export type {
  RedisHealthStatus,
  IUseRedisHealthOptions,
  IUseRedisHealthResult,
} from './use-redis-health';
