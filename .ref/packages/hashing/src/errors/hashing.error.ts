/**
 * @file hashing.error.ts
 * @module @stackra/ts-hashing/errors
 * @description Hashing-specific error class for all hashing operation failures.
 *   Thrown when a driver cannot hash, verify, or parse a hash string.
 */

// ════════════════════════════════════════════════════════════════════════════════
// Error Class
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Error thrown when a hashing operation fails.
 *
 * Covers scenarios such as:
 * - Driver not found or not supported
 * - Hash format is invalid or corrupted
 * - Underlying crypto library failure
 * - Configuration mismatch
 *
 * @example
 * ```typescript
 * throw new HashingError('Driver [md5] is not supported.');
 * ```
 */
export class HashingError extends Error {
  /**
   * @param message - Human-readable description of what went wrong
   */
  public constructor(message: string) {
    super(message);
    this.name = 'HashingError';
    Object.setPrototypeOf(this, HashingError.prototype);
  }
}
