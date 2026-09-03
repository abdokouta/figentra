/**
 * @file hash-info.type.ts
 * @module @stackra/ts-hashing/types
 * @description Type definition for hash analysis results.
 *   Returned by the hash analyzer utility and the base driver's `info()` method.
 */

// ════════════════════════════════════════════════════════════════════════════════
// Type
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Information extracted from a hashed value.
 *
 * Contains the detected algorithm, validity flag, and algorithm-specific
 * parameters (rounds, memory cost, etc.).
 */
export interface IHashInfo {
  /** The detected hashing algorithm name, or null if unrecognized. */
  algorithm: string | null;

  /** Whether the hash string appears to be a valid, well-formed hash. */
  valid: boolean;

  /** Algorithm-specific options extracted from the hash (rounds, memory cost, etc.). */
  options: Record<string, unknown>;
}
