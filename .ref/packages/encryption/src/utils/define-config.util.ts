/**
 * @file define-config.util.ts
 * @module @stackra/nestjs-encryption/utils
 * @description Configuration utility for type-safe encryption config definition.
 */

import type { IEncryptionConfig } from '../interfaces';

// ════════════════════════════════════════════════════════════════════════════════
// Utility
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Define a type-safe encryption configuration object.
 *
 * Provides autocomplete and validation for encryption module options.
 *
 * @param config - The encryption configuration
 * @returns The same configuration object (identity function for type safety)
 *
 * @example
 * ```typescript
 * import { IdefineConfig } from '@stackra/nestjs-encryption';
 *
 * export default IdefineConfig({
 *   key: process.env.APP_KEY!,
 *   cipher: 'aes-256-gcm',
 *   previousKeys: [],
 * });
 * ```
 */
export function IdefineConfig(config: IEncryptionConfig): IEncryptionConfig {
  return config;
}
