/**
 * @file base.driver.ts
 * @module @stackra/ts-hashing/drivers
 * @description Abstract base class for hashing drivers.
 *   Provides shared functionality for hash analysis, detection, and
 *   constant-time comparison that all concrete drivers inherit.
 */

import type { IHasher } from '@stackra/contracts';

import type { IHashInfo } from '../types';
import { timingSafeCompare } from '../utils/timing-safe-compare.util';
import { analyzeHash } from '../utils/hash-analyzer.util';

// ════════════════════════════════════════════════════════════════════════════════
// Abstract Driver
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Abstract base class for hashing drivers.
 *
 * Provides shared utility methods that all hashing driver implementations
 * can use. Concrete drivers must implement the `IHasher` interface methods:
 * `make()`, `check()`, `needsRehash()`, and `info()`.
 *
 * Shared features:
 * - `hashInfo()` — structured hash analysis via the hash analyzer
 * - `isHashed()` — detection of whether a value appears to be a hash
 * - `timingSafeCompare()` — constant-time string comparison
 *
 * @example
 * ```typescript
 * export class MyHasher extends BaseHashingDriver implements IHasher {
 *   async make(value: string): Promise<string> { ... }
 *   async check(value: string, hash: string): Promise<boolean> { ... }
 *   needsRehash(hash: string): boolean { ... }
 *   info(hash: string): Record<string, unknown> { ... }
 * }
 * ```
 */
export abstract class BaseHashingDriver implements IHasher {
  // ══════════════════════════════════════════════════════════════════════════════
  // Abstract Methods (from IHasher)
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Hash a plain-text value.
   *
   * @param value - The plain-text value to hash
   * @param options - Driver-specific options
   * @returns The hashed value
   */
  public abstract make(value: string, options?: Record<string, unknown>): Promise<string>;

  /**
   * Verify a plain-text value against a hash.
   *
   * @param value - The plain-text value to check
   * @param hash - The hash to compare against
   * @returns `true` if the value matches the hash
   */
  public abstract check(value: string, hash: string): Promise<boolean>;

  /**
   * Determine if a hash needs to be rehashed with current settings.
   *
   * @param hash - The hash to check
   * @param options - Optional override for parameters
   * @returns `true` if the hash should be recomputed
   */
  public abstract needsRehash(hash: string, options?: Record<string, unknown>): boolean;

  /**
   * Extract information from a hash string.
   *
   * @param hash - The hash to analyze
   * @returns Object containing algorithm info
   */
  public abstract info(hash: string): Record<string, unknown>;

  // ══════════════════════════════════════════════════════════════════════════════
  // Shared Methods
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Get structured hash information using the hash analyzer.
   *
   * @param hashedValue - The hash string to analyze
   * @returns Structured hash information with algorithm, validity, and options
   */
  public hashInfo(hashedValue: string): IHashInfo {
    return analyzeHash(hashedValue);
  }

  /**
   * Determine if a value appears to be a hashed string.
   *
   * Checks whether the value matches known hash format patterns
   * (bcrypt, argon2, scrypt).
   *
   * @param value - The string to check
   * @returns `true` if the value appears to be a hash
   */
  public isHashed(value: string): boolean {
    const info = analyzeHash(value);
    return info.algorithm !== null && info.valid;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Protected Helpers
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Perform a constant-time string comparison.
   *
   * Prevents timing attacks by ensuring comparison time is independent
   * of where the first difference occurs.
   *
   * @param a - First string to compare
   * @param b - Second string to compare
   * @returns `true` if the strings are identical
   */
  protected timingSafeCompare(a: string, b: string): boolean {
    return timingSafeCompare(a, b);
  }
}
