/**
 * @file limiter-builder.service.ts
 * @module @stackra/nestjs-redis/limiters
 * @description Fluent builder API for the concurrency limiter (funnel pattern).
 *   Provides the `funnel()` entry point that mirrors Laravel's builder pattern.
 *
 *   Note: Duration-based rate limiting (throttle) is handled by
 *   `@stackra/nestjs-rate-limit` at the HTTP route level. This builder
 *   is for service-level concurrency control only.
 */

import { IInjectable } from '@nestjs/common';

import { ConcurrencyLimiterService } from './concurrency-limiter.service';

/**
 * Fluent concurrency limiter builder.
 *
 * Provides the `funnel()` entry point for building concurrency limiters
 * with a chainable API. Use this for protecting shared resources from
 * concurrent access (e.g., payment gateways, external API calls).
 *
 * For HTTP request rate limiting, use `@stackra/nestjs-rate-limit` instead.
 *
 * @example
 * ```typescript
 * await limiterBuilder.funnel('payment-gateway')
 *   .limit(5)
 *   .releaseAfter(60)
 *   .block(10)
 *   .then(async () => {
 *     // Max 5 concurrent executions
 *   });
 * ```
 */
@IInjectable()
export class LimiterBuilder {
  /**
   * @param concurrency - Concurrency limiter service.
   */
  public constructor(private readonly concurrency: ConcurrencyLimiterService) {}

  /**
   * Create a concurrency limiter builder (funnel pattern).
   *
   * Restricts the number of simultaneous executions of a named resource.
   * Slots are TTL-guarded to prevent deadlocks from crashed processes.
   *
   * @param name - The resource identifier to protect.
   * @returns A fluent builder for concurrency limiting.
   *
   * @example
   * ```typescript
   * // Limit to 3 concurrent Stripe API calls
   * await limiterBuilder.funnel('stripe-api')
   *   .limit(3)
   *   .releaseAfter(30)
   *   .block(10)
   *   .then(async () => {
   *     await stripe.charges.create({ ... });
   *   });
   * ```
   */
  public funnel(name: string): IFunnelBuilder {
    let maxSlots = 1;
    let releaseAfter = 60;
    let blockTimeout = 3;
    let sleepMs = 250;

    const builder: IFunnelBuilder = {
      limit: (slots: number) => {
        maxSlots = slots;
        return builder;
      },
      releaseAfter: (seconds: number) => {
        releaseAfter = seconds;
        return builder;
      },
      block: (seconds: number) => {
        blockTimeout = seconds;
        return builder;
      },
      sleep: (ms: number) => {
        sleepMs = ms;
        return builder;
      },
      then: async <T>(
        callback: () => Promise<T> | T,
        failure?: (error: Error) => T
      ): Promise<T> => {
        try {
          return await this.concurrency.block(
            name,
            maxSlots,
            releaseAfter,
            blockTimeout,
            callback,
            sleepMs
          );
        } catch (error: unknown) {
          if (failure) return failure(error as Error);
          throw error;
        }
      },
    };

    return builder;
  }
}
