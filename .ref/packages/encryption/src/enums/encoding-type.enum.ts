/**
 * @file encoding-type.enum.ts
 * @module @stackra/nestjs-encryption/enums
 * @description Enumeration of supported encoding types for encrypted output.
 */

// ════════════════════════════════════════════════════════════════════════════════
// Enum
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Supported encoding types for serializing encrypted data.
 */
export enum EncodingType {
  /** Standard base64 encoding. */
  BASE64 = 'base64',
  /** URL-safe base64 encoding (replaces + and / with - and _). */
  BASE64URL = 'base64url',
  /** Hexadecimal encoding. */
  HEX = 'hex',
}
