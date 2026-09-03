/**
 * @file rate-limit.decorator.ts
 * @module @stackra/nestjs-rate-limit/decorators
 * @description `@RateLimit()` decorator for method/class-level throttling.
 *   Stores metadata consumed by the RateLimitGuard at request time.
 *
 *   Two configuration shapes:
 *   - Inline: `@RateLimit({ limit: 60, window: 60, key: 'user:{userId}' })`
 *   - Policy: `@RateLimit({ policy: 'api' })`
 *
 * @example
 * ```typescript
 * @Controller('products')
 * @RateLimit({ policy: 'api' })
 * export class ProductController {
 *
 *   @Post('upload')
 *   @RateLimit({ limit: 5, window: 60, key: 'upload:{userId}' })
 *   async upload() { ... }
 * }
 * ```
 */

import { SetMetadata } from '@nestjs/common';

// ============================================================================
// Metadata Key
// ============================================================================

/**
 * Metadata key for rate limit configuration on controllers/methods.
 */
export const RATE_LIMIT_KEY = 'RATE_LIMIT_OPTIONS';

// ============================================================================
// Options Interface
// ============================================================================

// ============================================================================
// Decorator
// ============================================================================

/**
 * Apply rate limiting to a controller class or individual route handler.
 *
 * Method-level decorators override class-level decorators.
 * The `RateLimitGuard` reads this metadata at request time.
 *
 * @param options - Rate limit configuration (policy name or inline limit/window/key)
 * @returns NestJS metadata decorator
 *
 * @example
 * ```typescript
 * // Using a named policy
 * @RateLimit({ policy: 'api' })
 *
 * // Using inline configuration
 * @RateLimit({ limit: 10, window: 60, key: 'login:{ip}' })
 *
 * // Skip rate limiting on a specific route
 * @RateLimit({ skip: true })
 * ```
 */
export const RateLimit = (options: IRateLimitOptions) => SetMetadata(RATE_LIMIT_KEY, options);

/**
 * Skip rate limiting for a specific route.
 *
 * Use on routes that should bypass the global rate limit guard
 * (e.g., health checks, public static assets).
 *
 * @returns NestJS metadata decorator
 *
 * @example
 * ```typescript
 * @SkipRateLimit()
 * @Get('health')
 * async healthCheck() { return { status: 'ok' }; }
 * ```
 */
export const SkipRateLimit = () => SetMetadata(RATE_LIMIT_KEY, { skip: true });
