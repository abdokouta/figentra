/**
 * @file defaults.constant.ts
 * @module @stackra/nestjs-encryption/constants
 * @description Default configuration values for the encryption module.
 */

import type { IEncryptionConfig } from '../interfaces';

// ════════════════════════════════════════════════════════════════════════════════
// Defaults
// ════════════════════════════════════════════════════════════════════════════════

/** Default encryption configuration. */
export const DEFAULT_ENCRYPTION_CONFIG: IEncryptionConfig = {
  key: '',
  cipher: 'aes-256-gcm',
  previousKeys: [],
};
