/**
 * `@stackra/nestjs-rate-limit` — Unified rate limiting for NestJS.
 *
 * Token-bucket algorithm with pluggable backends (Redis via `@stackra/ts-redis`,
 * in-memory), decorator-driven route throttling, named policies, and response headers.
 *
 * The `RateLimiterManager` extends `Manager<IRateLimiterBackend>` from
 * `@stackra/ts-support` — backend selection is config-driven, custom
 * backends are registered via `forFeature()` which calls `manager.extend()`.
 *
 * The Redis backend uses `@stackra/ts-redis`'s `RedisManager` for connection
 * management — sharing the same connection pool as `@stackra/nestjs-pubsub`
 * and `@stackra/nestjs-queue`.
 *
 * @example Quick start
 * ```typescript
 * // 1. Register the module
 * @Module({
 *   imports: [
 *     RedisModule.forRoot({ default: 'main', connections: { main: { driver: 'ioredis', ... } } }),
 *     RateLimitModule.forRoot({
 *       backend: 'redis',
 *       redis: { connection: 'main', prefix: 'rl:' },
 *       policies: {
 *         api: { limit: 60, window: 60, key: 'user:{userId}' },
 *       },
 *     }),
 *   ],
 * })
 * export class AppModule {}
 *
 * // 2. Use the decorator on routes
 * @Controller('products')
 * @UseGuards(RateLimitGuard)
 * @RateLimit({ policy: 'api' })
 * export class ProductController { ... }
 *
 * // 3. Or use the manager directly in services
 * @Injectable()
 * export class WebhookDispatcher {
 *   constructor(private readonly rateLimiter: RateLimiterManager) {}
 *
 *   async dispatch(subscriptionId: string) {
 *     const wait = await this.rateLimiter.reserve(
 *       `webhook:${subscriptionId}`, 100, 60
 *     );
 *     if (wait > 0) { // delay job }
 *   }
 * }
 * ```
 *
 * @module @stackra/nestjs-rate-limit
 */

// ============================================================================
// Module
// ============================================================================

export { RateLimitModule } from './rate-limit.module';
export type { IBackendDefinition } from './rate-limit.module';

// ============================================================================
// Services
// ============================================================================

export { RateLimiterManager } from './services';

// ============================================================================
// Guards
// ============================================================================

export { RateLimitGuard } from './guards';

// ============================================================================
// Decorators
// ============================================================================

export { RateLimit, SkipRateLimit, RATE_LIMIT_KEY } from './decorators';

// ============================================================================
// Backends
// ============================================================================

export { MemoryBackend } from './backends';
export { RedisBackend } from './backends';

// ============================================================================
// Constants
// ============================================================================

export {
  RATE_LIMIT_CONFIG,
  RATE_LIMITER,
  RATE_LIMIT_EVENTS,
  RATE_LIMIT_DEFAULTS,
} from './constants';
export type { RateLimitEventName } from './constants';

// ============================================================================
// Interfaces
// ============================================================================

export type {
  IRateLimiterBackend,
  IRateLimitConfig,
  IRedisConfig,
  IRateLimitPolicy,
  IHeadersConfig,
  IReserveResult,
} from './interfaces';

// ============================================================================
// Utils
// ============================================================================
export { defineConfig } from './utils';
