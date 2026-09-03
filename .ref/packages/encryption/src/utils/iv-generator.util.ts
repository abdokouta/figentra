/**
 * @file iv-generator.util.ts
 * @module @stackra/nestjs-encryption/utils
 * @description Initialization vector generation utility.
 *   Produces cryptographically secure random bytes for use as cipher IVs.
 */

import { randomBytes } from 'node:crypto';

// ════════════════════════════════════════════════════════════════════════════════
// Utility
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Generate a cryptographically secure initialization vector.
 *
 * Uses `crypto.randomBytes()` to produce random bytes suitable for use
 * as an IV in AES encryption operations.
 *
 * @param length - IV length in bytes (default: 16 for CBC, use 12 for GCM)
 * @returns A Buffer containing random bytes
 *
 * @example
 * ```typescript
 * const iv = generateIv(12); // 12 bytes for GCM
 * const iv16 = generateIv();  // 16 bytes for CBC (default)
 * ```
 */
export function generateIv(length?: number): Buffer {
  return randomBytes(length ?? 16);
}
