/**
 * @file key-generator.util.ts
 * @module @stackra/nestjs-encryption/utils
 * @description Encryption key generation and validation utilities.
 *   Generates cryptographically secure keys and validates key lengths
 *   against cipher requirements.
 */

import { randomBytes } from 'node:crypto';

import { CipherAlgorithm } from '../enums';

// ════════════════════════════════════════════════════════════════════════════════
// Constants
// ════════════════════════════════════════════════════════════════════════════════

/** Map of cipher algorithms to their required key sizes in bytes. */
export const CIPHER_KEY_SIZES: Record<CipherAlgorithm, number> = {
  [CipherAlgorithm.AES_128_CBC]: 16,
  [CipherAlgorithm.AES_256_CBC]: 32,
  [CipherAlgorithm.AES_128_GCM]: 16,
  [CipherAlgorithm.AES_256_GCM]: 32,
};

// ════════════════════════════════════════════════════════════════════════════════
// Utilities
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Generate a cryptographically secure encryption key for the specified cipher.
 *
 * Returns a base64-encoded random key of the appropriate length for
 * the given cipher algorithm.
 *
 * @param cipher - The cipher algorithm to generate a key for
 * @returns A base64-encoded random key string
 *
 * @example
 * ```typescript
 * const key = generateKey(CipherAlgorithm.AES_256_GCM);
 * // => 'a1b2c3d4...' (44 chars base64 = 32 bytes)
 * ```
 */
export function generateKey(cipher: CipherAlgorithm): string {
  const size = CIPHER_KEY_SIZES[cipher];
  return randomBytes(size).toString('base64');
}

/**
 * Validate that a key is the correct length for the specified cipher.
 *
 * Attempts to decode the key as base64 first. If the decoded length matches
 * the cipher requirement, the key is valid. Otherwise checks the raw UTF-8 length.
 *
 * @param key - The encryption key to validate (base64 or raw)
 * @param cipher - The cipher algorithm to validate against
 * @returns `true` if the key length matches the cipher requirement
 *
 * @example
 * ```typescript
 * const isValid = supported(myKey, CipherAlgorithm.AES_256_GCM);
 * if (!isValid) throw new InvalidKeyError('Key must be 32 bytes.');
 * ```
 */
export function supported(key: string, cipher: CipherAlgorithm): boolean {
  const expectedSize = CIPHER_KEY_SIZES[cipher];
  if (!expectedSize) {
    return false;
  }

  // Try base64 decode
  const decoded = Buffer.from(key, 'base64');
  if (decoded.length === expectedSize) {
    return true;
  }

  // Try raw UTF-8 length
  const raw = Buffer.from(key, 'utf-8');
  return raw.length === expectedSize;
}
