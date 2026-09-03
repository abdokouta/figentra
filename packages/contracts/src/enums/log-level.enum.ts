/**
 * @file log-level.enum.ts
 * @module @stackra/contracts/enums
 * @description Numeric log-level enum for severity-based filtering.
 *   Used by logger drivers to compare against the configured minimum level.
 */

/**
 * Numeric log severity levels (ascending). Every logger driver compares
 * the incoming level against the configured threshold.
 */
export enum LogLevel {
  /** Diagnostic detail — local dev only. */
  DEBUG = 0,
  /** Routine operational information. */
  INFO = 1,
  /** Unexpected but non-fatal condition. */
  WARN = 2,
  /** Failed operation requiring attention. */
  ERROR = 3,
  /** Unrecoverable failure — service must restart. */
  FATAL = 4,
}
