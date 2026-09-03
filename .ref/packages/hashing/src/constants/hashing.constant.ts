/**
 * @file hashing.constant.ts
 * @module @stackra/ts-hashing/constants
 * @description DI tokens and default configuration values for the hashing module.
 *   Tokens are re-exported from `@stackra/contracts` for convenience.
 *   Default values define sensible security parameters for each driver.
 */

import { HASH_MANAGER, HASHING_CONFIG } from '@stackra/contracts';

// ════════════════════════════════════════════════════════════════════════════════
// DI Tokens (re-exported from contracts)
// ════════════════════════════════════════════════════════════════════════════════

export { HASH_MANAGER, HASHING_CONFIG };

/** Prefix for driver-specific DI tokens (e.g., `HASHING_DRIVER_bcrypt`). */
export const HASHING_DRIVER_PREFIX = 'HASHING_DRIVER_';

// ════════════════════════════════════════════════════════════════════════════════
// Default Values
// ════════════════════════════════════════════════════════════════════════════════

/** Default number of rounds for bcrypt hashing. */
export const DEFAULT_BCRYPT_ROUNDS = 12;
