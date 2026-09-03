/**
 * @file use-redis.hook.ts
 * @module @stackra/react-redis/hooks/use-redis
 * @description React hook to get a Redis client by connection name.
 *   Resolves the client from the DI container via `useInject`.
 */

import { useInject } from '@stackra/ts-container/react';
import type { IRedisClient } from '@stackra/contracts';
import { getRedisClientToken } from '../../core/utils';

/**
 * Get a Redis client by connection name.
 *
 * Resolves the `IRedisClient` for the specified (or default) connection
 * from the DI container. Works on both web and React Native.
 *
 * @param name - The connection name from configuration. Omit for default.
 * @returns The resolved Redis client.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const redis = useRedis('cache');
 *   // redis.get('key'), redis.set('key', 'value'), etc.
 * }
 * ```
 */
export function useRedis(name?: string): IRedisClient {
  return useInject<IRedisClient>(getRedisClientToken(name));
}
