/**
 * @file static-array-backoff.strategy.ts
 * @module @stackra/nestjs-webhook/strategies
 * @description Backoff strategy that uses a static array of delay values.
 *   Returns the delay at the given attempt index, or the last element if
 *   the attempt exceeds the array length. Falls back to config defaults
 *   if the subscription has no custom backoff_seconds.
 */

import { IInjectable } from '@nestjs/common';

import type { IBackoffStrategy, IBackoffConfig } from '../interfaces';

// ============================================================================
// Constants
// ============================================================================

/** Default backoff delays in seconds when no config is provided. */
const DEFAULT_BACKOFF_SECONDS = [10, 60, 300, 900, 3600];

// ============================================================================
// Strategy
// ============================================================================

/**
 * Static array backoff strategy.
 *
 * Uses a pre-defined array of delay values (in seconds). For attempt N,
 * returns `backoff_seconds[N - 1]`. If the attempt exceeds the array length,
 * returns the last element (capped backoff).
 *
 * Falls back to the default array `[10, 60, 300, 900, 3600]` if the
 * subscription has no custom `backoff_seconds` configured.
 *
 * @example
 * ```typescript
 * // With backoff_seconds = [10, 60, 300, 900, 3600]
 * strategy.computeDelay(1, config); // 10000 ms
 * strategy.computeDelay(3, config); // 300000 ms
 * strategy.computeDelay(10, config); // 3600000 ms (last element)
 * ```
 */
@IInjectable()
export class StaticArrayBackoffStrategy implements IBackoffStrategy {
  /**
   * Compute the retry delay for a given attempt.
   *
   * Returns `backoff_seconds[attempt - 1]` converted to milliseconds.
   * If the attempt index exceeds the array length, the last element is used.
   *
   * @param attempt - The current attempt number (1-based).
   * @param config - Backoff configuration containing the delays array.
   * @returns Delay in milliseconds before the next retry.
   */
  public computeDelay(attempt: number, config: IBackoffConfig): number {
    const delays = config.backoff_seconds ?? DEFAULT_BACKOFF_SECONDS;
    const index = Math.min(attempt - 1, delays.length - 1);
    const delaySeconds = delays[index] ?? delays[delays.length - 1] ?? 60;

    return delaySeconds * 1000;
  }
}
