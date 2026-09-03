/**
 * @file defaults.constant.ts
 * @module @stackra/nestjs-health/constants
 * @description Default configuration values for the health module.
 *
 * All thresholds, timeouts, and limits defined here serve as fallbacks
 * when the consumer does not provide explicit values in forRoot().
 */

/** Default notification cooldown in seconds (5 minutes). */
export const DEFAULT_COOLDOWN_SECONDS = 300;

/** Default InMemoryResultStore capacity. */
export const DEFAULT_STORE_CAPACITY = 100;

/** Minimum InMemoryResultStore capacity. */
export const MIN_STORE_CAPACITY = 1;

/** Maximum InMemoryResultStore capacity. */
export const MAX_STORE_CAPACITY = 10000;

/** Maximum allowed indicator name length. */
export const MAX_INDICATOR_NAME_LENGTH = 64;

/** Regex pattern for valid indicator names. */
export const INDICATOR_NAME_PATTERN = /^[a-zA-Z0-9_-]+$/;
