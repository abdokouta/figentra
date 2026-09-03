/**
 * @file index.ts
 * @module @stackra/nestjs-redis/limiters
 * @description Barrel export for limiter services.
 *
 *   This package provides:
 *   - ConcurrencyLimiterService — slot-based concurrency control (funnel pattern)
 *   - DurationLimiterService — sliding window for service-level throttling
 *   - LimiterBuilder — fluent builder for concurrency limiting
 *
 *   For HTTP route-level rate limiting, use `@stackra/nestjs-rate-limit`.
 */

export { ConcurrencyLimiterService } from './concurrency-limiter.service';
export { DurationLimiterService } from './duration-limiter.service';
export { LimiterBuilder } from './limiter-builder.service';
export type { IFunnelBuilder } from './limiter-builder.service';
