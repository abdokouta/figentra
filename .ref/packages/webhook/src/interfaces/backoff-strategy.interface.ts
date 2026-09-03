/**
 * @file backoff-strategy.interface.ts
 * @module @stackra/nestjs-webhook/interfaces
 * @description Interface for webhook retry backoff strategies.
 *   Implementations compute the delay between retry attempts.
 */

// ============================================================================
// Interfaces
// ============================================================================

/**
 * Configuration passed to backoff strategy implementations.
 */
export interface IBackoffConfig {
  /** Static array of delay values in seconds (for StaticArrayBackoff). */
  backoff_seconds?: number[];

  /** Maximum attempts allowed. */
  max_attempts?: number;
}

/**
 * Contract for backoff strategy implementations.
 *
 * Strategies compute the delay (in milliseconds) before the next retry
 * attempt. Built-in implementations: StaticArrayBackoff, ExponentialBackoff.
 */
export interface IBackoffStrategy {
  /**
   * Compute the retry delay for a given attempt.
   *
   * @param attempt - The current attempt number (1-based).
   * @param config - Backoff configuration with strategy-specific options.
   * @returns Delay in milliseconds before the next retry.
   */
  computeDelay(attempt: number, config: IBackoffConfig): number;
}
