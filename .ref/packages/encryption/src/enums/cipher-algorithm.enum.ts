/**
 * @file cipher-algorithm.enum.ts
 * @module @stackra/nestjs-encryption/enums
 * @description Enumeration of supported cipher algorithms for encryption operations.
 *   Maps to Node.js `crypto` cipher identifiers.
 */

// ════════════════════════════════════════════════════════════════════════════════
// Enum
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Supported cipher algorithms for AES encryption.
 *
 * Each value corresponds directly to a Node.js `crypto.createCipheriv()`
 * algorithm identifier.
 */
export enum CipherAlgorithm {
  /** AES-128 in CBC mode (block cipher, requires HMAC for integrity). */
  AES_128_CBC = 'aes-128-cbc',
  /** AES-256 in CBC mode (block cipher, requires HMAC for integrity). */
  AES_256_CBC = 'aes-256-cbc',
  /** AES-128 in GCM mode (authenticated encryption, AEAD). */
  AES_128_GCM = 'aes-128-gcm',
  /** AES-256 in GCM mode (authenticated encryption, AEAD — recommended). */
  AES_256_GCM = 'aes-256-gcm',
}
