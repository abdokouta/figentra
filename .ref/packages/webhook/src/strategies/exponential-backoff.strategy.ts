/**
 * @file exponential-backoff.strategy.ts
 * @module @stackra/nestjs-webhook/strategies
 * @description Exponential backoff strategy with jitter.
 *   Computes delay as `baseDelay * 2^(attempt - 1)` capped at maxDelay,
 *   with random jitter to prevent thundering herd on retries.
 */

import { IInjectable } from '@nestjs/common';

import type { IBackoffStrategy, IBackoffConfig } from '../interfaces';

// ============================================================================
// Constants
// ============================================================================

/** Base delay in seconds for the first retry. */
const BASE_DELAY_SECONDS = 10;

/** Maximum delay cap: 1 hour in seconds. */
const MAX_DELAY_SECONDS = 3600;

/** Jitter factor: ±25% randomization applied to the computed delay. */
const JITTER_FACTOR = 0.25;

// ============================================================================
// Strategy
// ============================================================================

/**
 * Exponential backoff strategy with jitter.
 *
 * Computes delay as `baseDelay * 2^(attempt - 1)`, capped at 1 hour (3600s).
 * Applies ±25% random jitter to prevent thundering herd when multiple
 * subscriptions retry simultaneously.
 *
 * @example
 * ```typescript
 * strategy.computeDelay(1, config); // ~10000 ms (10s ± jitter)
 * strategy.computeDelay(2, config); // ~20000 ms (20s ± jitter)
 * strategy.computeDelay(3, config); // ~40000 ms (40s ± jitter)
 * strategy.computeDelay(5, config); // ~160000 ms (160s ± jitter)
 * strategy.computeDelay(20, config); // ~3600000 ms (capped at 1h ± jitter)
 * ```
 */
@IInjectable()
export class ExponentialBackoffStrategy implements IBackoffStrategy {
  /**
   * Compute the retry delay for a given attempt using exponential backoff.
   *
   * Formula: `min(baseDelay * 2^(attempt - 1), maxDelay) * (1 ± jitter)`
   *
   * @param attempt - The current attempt number (1-based).
   * @param _config - Backoff configuration (unused for exponential strategy).
   * @returns Delay in milliseconds before the next retry.
   */
  public computeDelay(attempt: number, _config: IBackoffConfig): number {
    const rawDelay = BASE_DELAY_SECONDS * Math.pow(2, attempt - 1);
    const cappedDelay = Math.min(rawDelay, MAX_DELAY_SECONDS);

    // Apply jitter: random value in range [1 - factor, 1 + factor]
    const jitterMultiplier = 1 + (Math.random() * 2 - 1) * JITTER_FACTOR;
    const finalDelay = cappedDelay * jitterMultiplier;

    return Math.round(finalDelay * 1000);
  }
}
