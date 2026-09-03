/**
 * @file define-config.util.ts
 * @module @stackra/ts-redis/utils
 * @description Type-safe configuration helper for Redis module options.
 *   Provides autocomplete and validation at the type level.
 */

import type { IRedisModuleOptions } from '@stackra/contracts';

/**
 * Define a type-safe Redis module configuration.
 *
 * This is a pass-through identity function that provides TypeScript
 * autocomplete and type checking for the configuration object.
 *
 * @param config - The Redis module configuration.
 * @returns The same configuration object (typed).
 *
 * @example
 * ```typescript
 * import { IdefineConfig } from '@stackra/redis';
 *
 * export const redisConfig = IdefineConfig({
 *   default: 'main',
 *   connections: {
 *     main: { driver: 'ioredis', host: 'localhost', port: 6379 },
 *     cache: { driver: 'upstash', url: '...', token: '...' },
 *   },
 * });
 * ```
 */
export function IdefineConfig(config: IRedisModuleOptions): IRedisModuleOptions {
  return config;
}
