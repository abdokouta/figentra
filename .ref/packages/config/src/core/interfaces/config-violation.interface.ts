/**
 * @file config-violation.interface.ts
 * @module @stackra/config/src/interfaces
 * @description IConfigViolation interface.
 */

/**
 * A single validation violation.
 */
export interface IConfigViolation {
  /** Dot-notation path to the invalid config key. */
  path: string;
  /** Human-readable description of the violation. */
  message: string;
  /** The invalid value that was provided. */
  value?: unknown;
}
