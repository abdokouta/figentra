/**
 * @file timing-safe-compare.util.ts
 * @module @stackra/ts-hashing/utils
 * @description Constant-time string comparison utility using Node.js crypto.
 *   Prevents timing attacks by ensuring comparison time is independent
 *   of where the first difference occurs.
 */

import { timingSafeEqual } from 'node:crypto';

// ════════════════════════════════════════════════════════════════════════════════
// Utility
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Perform a constant-time comparison of two strings.
 *
 * Uses `crypto.timingSafeEqual` under the hood to prevent timing attacks.
 * If the strings have different lengths, the comparison still runs in
 * constant time relative to the longer string by padding the shorter one.
 *
 * @param a - First string to compare
 * @param b - Second string to compare
 * @returns `true` if the strings are identical
 *
 * @example
 * ```typescript
 * const isValid = timingSafeCompare(userInput, storedHash);
 * ```
 */
export function timingSafeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf-8');
  const bufB = Buffer.from(b, 'utf-8');

  if (bufA.length !== bufB.length) {
    // Pad the shorter buffer to prevent length-based timing leaks
    const maxLength = Math.max(bufA.length, bufB.length);
    const paddedA = Buffer.alloc(maxLength);
    const paddedB = Buffer.alloc(maxLength);

    bufA.copy(paddedA);
    bufB.copy(paddedB);

    // Always run the comparison, but return false because lengths differ
    timingSafeEqual(paddedA, paddedB);
    return false;
  }

  return timingSafeEqual(bufA, bufB);
}
