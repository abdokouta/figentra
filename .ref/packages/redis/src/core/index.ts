/**
 * @file index.ts
 * @module @stackra/redis
 * @description Core Redis barrel. Exports the platform-agnostic manager,
 *   Upstash backend, cache store, decorators, errors, observability,
 *   scripts, tags, types, and utilities.
 *
 *   The ioredis backend is NOT exported here — it is server-only and
 *   available via the `./nestjs` subpath export.
 */

// ============================================================================
// Module
// ============================================================================

export { RedisModule } from './redis.module';

// ============================================================================
// Manager
// ============================================================================

export { RedisManager } from './manager';

// ============================================================================
// Backends (web-safe only)
// ============================================================================

export { UpstashBackend, UpstashClient } from './backends';

// ============================================================================
// Cache
// ============================================================================

export { RedisCacheStore } from './cache';

// ============================================================================
// Constants
// ============================================================================

export {
  DEFAULT_CACHE_TTL,
  DEFAULT_CACHE_PREFIX,
  DEFAULT_TAG_PREFIX,
  DEFAULT_SLOW_QUERY_THRESHOLD,
  DEFAULT_MAX_RETRIES,
  DEFAULT_RETRY_DELAY_MS,
  DEFAULT_BACKOFF_MULTIPLIER,
  DEFAULT_LOCK_TTL,
  DEFAULT_LOCK_TIMEOUT,
  DEFAULT_LOCK_RETRY_DELAY,
  DEFAULT_SLOT_RELEASE_AFTER,
  DEFAULT_LIMITER_BLOCK_TIMEOUT,
  DEFAULT_LIMITER_SLEEP_MS,
} from './constants';

// ============================================================================
// Decorators
// ============================================================================

export { InjectRedis } from './decorators';
export { InjectRedisManager } from './decorators';

// ============================================================================
// Errors
// ============================================================================

export {
  RedisError,
  RedisConnectionError,
  RedisCommandError,
  RedisTimeoutError,
  RedisScriptError,
  RedisConfigError,
  LockTimeoutError,
  LimiterTimeoutError,
} from './errors';

// ============================================================================
// Observability
// ============================================================================

export { CommandInterceptor } from './observability';
export type { ICommandExecutedEvent } from './observability';
export type { ICommandFailedEvent } from './observability';

// ============================================================================
// Scripts
// ============================================================================

export { ScriptRegistry } from './scripts';
export {
  TAG_INVALIDATE_SCRIPT,
  TAG_INVALIDATE_SCRIPT_NAME,
  DURATION_ACQUIRE_SCRIPT,
  DURATION_ACQUIRE_SCRIPT_NAME,
} from './scripts';

// ============================================================================
// Tags
// ============================================================================

export { TagManager } from './tags';

// ============================================================================
// Types
// ============================================================================

export type { RedisValue, RedisDataType } from './types';

// ============================================================================
// Utils
// ============================================================================

export {
  getRedisClientToken,
  buildKey,
  defineConfig,
  serializeValue,
  deserializeValue,
} from './utils';
export type { IKeyBuilderOptions } from './utils';

// ============================================================================
// Event Transport (bridges local events ↔ Redis pub/sub)
// ============================================================================
export { RedisEventTransport, REDIS_TRANSPORT_CONFIG } from './transport';
export type { IRedisEventTransportConfig } from './transport';
