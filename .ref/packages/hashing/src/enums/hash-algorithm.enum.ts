/**
 * @file hash-algorithm.enum.ts
 * @module @stackra/ts-hashing/enums
 * @description Enumeration of supported hashing algorithms.
 *   Used for type-safe algorithm selection and hash analysis results.
 */

// ════════════════════════════════════════════════════════════════════════════════
// Enum
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Supported hashing algorithm identifiers.
 *
 * Maps to the algorithm names recognized by the hashing drivers
 * and the hash analyzer utility.
 */
export enum HashAlgorithm {
  /** Bcrypt password hashing function (Blowfish-based). */
  BCRYPT = 'bcrypt',
  /** Argon2 (generic variant). */
  ARGON2 = 'argon2',
  /** Argon2id — hybrid mode (recommended). */
  ARGON2ID = 'argon2id',
  /** Scrypt — memory-hard key derivation function. */
  SCRYPT = 'scrypt',
}
