/**
 * @file get-redis-client-token.util.ts
 * @module @stackra/ts-redis/utils
 * @description Factory for per-connection DI tokens. Each named connection
 *   gets a unique Symbol so `@InjectRedis('name')` resolves the correct client.
 */

/**
 * Token prefix for Redis client connections.
 */
const REDIS_CLIENT_TOKEN_PREFIX = 'REDIS_CLIENT:';

/**
 * Get or create a DI token for a named Redis client.
 *
 * When called without a name, returns the token for the default connection.
 * Tokens are stable — calling with the same name always returns the same Symbol.
 *
 * @param name - The connection name. Omit for the default connection token.
 * @returns A unique Symbol for the connection.
 *
 * @example
 * ```typescript
 * const token = getRedisClientToken('cache');
 * // Symbol.for('REDIS_CLIENT:cache')
 * ```
 */
export function getRedisClientToken(name?: string): symbol {
  const key = name ? `${REDIS_CLIENT_TOKEN_PREFIX}${name}` : `${REDIS_CLIENT_TOKEN_PREFIX}default`;
  return Symbol.for(key);
}
