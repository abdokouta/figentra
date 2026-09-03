/**
 * @file decryption.error.ts
 * @module @stackra/nestjs-encryption/errors
 * @description Specific error for decryption failures.
 *   Thrown when a payload cannot be decrypted with any available key.
 */

import { EncryptionError } from './encryption.error';

// ════════════════════════════════════════════════════════════════════════════════
// Error Class
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Error thrown when decryption fails.
 *
 * Indicates that the payload could not be decrypted — possibly due to
 * key mismatch, corrupted data, or tampered ciphertext.
 *
 * @example
 * ```typescript
 * throw new DecryptionError('Unable to decrypt: authentication tag mismatch.');
 * ```
 */
export class DecryptionError extends EncryptionError {
  /**
   * @param message - Human-readable description of the decryption failure
   */
  public constructor(message: string = 'Decryption failed.') {
    super(message);
    this.name = 'DecryptionError';
    Object.setPrototypeOf(this, DecryptionError.prototype);
  }
}
