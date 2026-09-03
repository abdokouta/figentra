/**
 * @file redis-value.type.ts
 * @module @stackra/ts-redis/types
 * @description Redis value types used across the package.
 */

/**
 * Possible Redis value types returned by commands.
 */
export type RedisValue = string | number | null;

/**
 * Redis data type identifiers returned by the TYPE command.
 */
export type RedisDataType = 'string' | 'hash' | 'list' | 'set' | 'zset' | 'stream' | 'none';
