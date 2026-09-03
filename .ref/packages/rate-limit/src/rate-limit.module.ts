/**
 * @file rate-limit.module.ts
 * @module @stackra/nestjs-rate-limit
 * @description RateLimitModule — root NestJS dynamic module for unified
 *   rate limiting across the application.
 *
 *   Provides `forRoot()` for global configuration (backend, policies, headers)
 *   and `forFeature()` for registering custom backends via `manager.extend()`.
 *
 * @example
 * ```typescript
 * // Root module — configure backend and policies
 * @Module({
 *   imports: [
 *     RateLimitModule.forRoot({
 *       backend: 'redis',
 *       redis: { host: 'localhost', prefix: 'rl:' },
 *       policies: {
 *         api: { limit: 60, window: 60, key: 'user:{userId}' },
 *         login: { limit: 10, window: 60, key: 'ip:{ip}' },
 *       },
 *     }),
 *   ],
 * })
 * export class AppModule {}
 *
 * // Feature module — register a custom backend
 * @Module({
 *   imports: [
 *     RateLimitModule.forFeature([
 *       { name: 'dynamodb', creator: (mgr) => new DynamoBackend(config) },
 *     ]),
 *   ],
 * })
 * export class InfraModule {}
 * ```
 */

import { Module, type IDynamicModule, type IProvider } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { RATE_LIMIT_CONFIG, RATE_LIMITER } from './constants/tokens.constant';
import { RATE_LIMIT_DEFAULTS } from './constants/defaults.constant';
import { RateLimiterManager } from './services/rate-limiter-manager.service';
import { RateLimitGuard } from './guards/rate-limit.guard';
import type { IRateLimitConfig, IRateLimiterBackend } from './interfaces';
import type { ManagerDriverCreator } from '@stackra/ts-support';

// ============================================================================
// Types
// ============================================================================

// ============================================================================
// Module
// ============================================================================

/**
 * RateLimitModule — unified rate limiting for NestJS.
 *
 * Provides a `RateLimiterManager` (extends `Manager<IRateLimiterBackend>`)
 * with pluggable backends, named policies, a `@RateLimit()` decorator,
 * and a `RateLimitGuard` for route-level throttling.
 */
@Module({})
export class RateLimitModule {
  /**
   * Register the rate limit module globally with configuration.
   *
   * Merges provided options with defaults, registers the manager,
   * guard, and binds the RATE_LIMITER token.
   *
   * @param options - Partial rate limit configuration (merged with defaults)
   * @returns A global NestJS dynamic module
   */
  public static forRoot(options?: Partial<IRateLimitConfig>): IDynamicModule {
    const config = mergeWithDefaults(options);

    const providers: IProvider[] = [
      // Configuration token
      { provide: RATE_LIMIT_CONFIG, useValue: config },

      // Manager (extends Manager<IRateLimiterBackend>)
      RateLimiterManager,

      // Convenience token alias
      { provide: RATE_LIMITER, useExisting: RateLimiterManager },

      // Guard (available for @UseGuards or global registration)
      RateLimitGuard,
    ];

    // Register as global guard when globalGuard policy is specified
    if (typeof config.globalGuard === 'string' && config.globalGuard) {
      providers.push({
        provide: APP_GUARD,
        useExisting: RateLimitGuard,
      });
    }

    return {
      module: RateLimitModule,
      global: true,
      providers,
      exports: [RATE_LIMIT_CONFIG, RATE_LIMITER, RateLimiterManager, RateLimitGuard],
    };
  }

  /**
   * Register custom backend drivers.
   *
   * Uses `manager.extend(name, creator)` from the `Manager<T>` base class
   * to register additional backends beyond the built-in memory and redis.
   *
   * @param backends - Array of custom backend definitions
   * @returns A NestJS dynamic module that registers the backends
   *
   * @example
   * ```typescript
   * RateLimitModule.forFeature([
   *   {
   *     name: 'dynamodb',
   *     creator: (manager) => new DynamoDbBackend(dynamoConfig),
   *   },
   *   {
   *     name: 'cluster',
   *     creator: (manager) => new RedisClusterBackend(clusterConfig),
   *   },
   * ])
   * ```
   */
  public static forFeature(backends: IBackendDefinition[]): IDynamicModule {
    const registrations: IProvider[] = backends.map((backend, index) => ({
      provide: `RATE_LIMIT_BACKEND_REG_${backend.name}_${index}`,
      useFactory: (manager: RateLimiterManager) => {
        manager.extend(backend.name, backend.creator as any);
      },
      inject: [RateLimiterManager],
    }));

    return {
      module: RateLimitModule,
      providers: registrations,
    };
  }
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Deep-merge user options with default configuration.
 *
 * @param options - Partial user-provided configuration
 * @returns Fully resolved rate limit configuration
 */
function mergeWithDefaults(options?: Partial<IRateLimitConfig>): IRateLimitConfig {
  if (!options) {
    return { ...RATE_LIMIT_DEFAULTS };
  }

  return {
    backend: options.backend ?? RATE_LIMIT_DEFAULTS.backend,
    redis: { ...RATE_LIMIT_DEFAULTS.redis, ...options.redis },
    policies: { ...RATE_LIMIT_DEFAULTS.policies, ...options.policies },
    headers: { ...RATE_LIMIT_DEFAULTS.headers, ...options.headers },
    includeHeaders: options.includeHeaders ?? RATE_LIMIT_DEFAULTS.includeHeaders,
    globalGuard: options.globalGuard ?? RATE_LIMIT_DEFAULTS.globalGuard,
  };
}
