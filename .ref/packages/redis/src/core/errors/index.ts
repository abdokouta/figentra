/**
 * @file index.ts
 * @module @stackra/ts-redis/errors
 * @description Barrel export for all Redis error classes.
 */

export { RedisError } from './redis.error';
export { RedisConnectionError } from './redis-connection.error';
export { RedisCommandError } from './redis-command.error';
export { RedisTimeoutError } from './redis-timeout.error';
export { RedisScriptError } from './redis-script.error';
export { RedisConfigError } from './redis-config.error';
export { LockTimeoutError } from './lock-timeout.error';
export { LimiterTimeoutError } from './limiter-timeout.error';
