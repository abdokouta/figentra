/**
 * @file encryption.error.ts
 * @module @stackra/nestjs-encryption/errors
 * @description Error classes for encryption operation failures.
 */

// ════════════════════════════════════════════════════════════════════════════════
// Error Classes
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Error thrown when an encryption or decryption operation fails.
 *
 * Covers scenarios such as:
 * - Invalid key length or format
 * - Corrupted payload during decryption
 * - Authentication tag mismatch (GCM)
 * - Key rotation exhausted without successful decryption
 *
 * @example
 * ```typescript
 * throw new EncryptionError('Failed to decrypt: authentication tag mismatch.');
 * ```
 */
export class EncryptionError extends Error {
  /**
   * @param message - Human-readable description of what went wrong
   */
  public constructor(message: string) {
    super(message);
    this.name = 'EncryptionError';
    Object.setPrototypeOf(this, EncryptionError.prototype);
  }
}
