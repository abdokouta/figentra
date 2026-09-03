/**
 * @file encrypted-payload.type.ts
 * @module @stackra/nestjs-encryption/types
 * @description Type definition for the encrypted payload structure.
 *   Represents the JSON object stored inside a base64-encoded ciphertext string.
 */

// ════════════════════════════════════════════════════════════════════════════════
// Type
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Structure of an encrypted payload after base64 decoding.
 *
 * Contains all the components needed to decrypt a value:
 * initialization vector, encrypted data, MAC/HMAC, and auth tag.
 */
export interface IEncryptedPayload {
  /** Base64-encoded initialization vector. */
  iv: string;

  /** Base64-encoded encrypted value. */
  value: string;

  /** Base64-encoded HMAC for integrity verification (CBC mode). */
  mac: string;

  /** Base64-encoded authentication tag (GCM mode). */
  tag: string;
}
