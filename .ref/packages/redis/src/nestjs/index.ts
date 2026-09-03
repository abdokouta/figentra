/**
 * @file index.ts
 * @module @stackra/redis/nestjs
 * @description NestJS Redis adapter with distributed primitives.
 *   Wraps the core Redis module with automatic ioredis registration and
 *   provides locks, limiters, health indicators, and command logging.
 */

// ============================================================================
// Module
// ============================================================================

export { NestRedisModule } from './nest-redis.module';

// ============================================================================
// Locks
// ============================================================================

export { LockService, Lock } from './locks';

// ============================================================================
// Limiters
// ============================================================================

export { ConcurrencyLimiterService, DurationLimiterService, LimiterBuilder } from './limiters';
export type { IFunnelBuilder } from './limiters';

// ============================================================================
// Health
// ============================================================================

export { RedisHealthIndicator } from './health';

// ============================================================================
// Listeners
// ============================================================================

export { SlowQueryLogger } from './listeners';

// ============================================================================
// Streams
// ============================================================================

export {
  StreamProducerService,
  StreamConsumerService,
  StreamManager,
  StreamProcessor,
  STREAM_PROCESSOR_METADATA_KEY,
} from './streams';
export type {
  IStreamProducerOptions,
  IStreamConsumerLoopOptions,
  IStreamProcessorMetadata,
} from './streams';

// ============================================================================
// Serialization
// ============================================================================

export {
  JsonSerializer,
  MsgpackSerializer,
  CompressedSerializer,
  SerializerRegistry,
} from './serialization';

// ============================================================================
// Re-exports from core (convenience)
// ============================================================================

export {
  RedisModule,
  RedisManager,
  UpstashBackend,
  UpstashClient,
  RedisCacheStore,
  InjectRedis,
  InjectRedisManager,
  defineConfig,
  buildKey,
  getRedisClientToken,
  serializeValue,
  deserializeValue,
  CommandInterceptor,
  ScriptRegistry,
  TagManager,
  RedisError,
  RedisConnectionError,
  RedisCommandError,
  RedisTimeoutError,
  RedisScriptError,
  RedisConfigError,
  LockTimeoutError,
  LimiterTimeoutError,
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
} from '../core/index';

export type {
  RedisValue,
  RedisDataType,
  IKeyBuilderOptions,
  ICommandExecutedEvent,
  ICommandFailedEvent,
} from '../core/index';

// ============================================================================
// Re-export ioredis backend (server-only)
// ============================================================================

export { IoredisBackend, IoredisClient, IoredisSubscriber } from '../core/backends/ioredis';
