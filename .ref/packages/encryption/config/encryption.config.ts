/**
 * @file encryption.config.ts
 * @module @stackra/nestjs-encryption/config
 * @description Preset configuration for the encryption module.
 *   Provides a ready-to-use config for AES-256-GCM encryption.
 */

import { IdefineConfig } from '../src/utils';

/**
 * Default encryption configuration preset.
 *
 * Uses AES-256-GCM with no key rotation. The `key` must be overridden
 * by the application via environment variables.
 *
 * @example
 * ```typescript
 * import encryptionConfig from '@stackra/nestjs-encryption/config/encryption.config';
 *
 * @Module({
 *   imports: [NestEncryptionModule.forRoot({
 *     ...encryptionConfig,
 *     key: process.env.APP_KEY!,
 *   })],
 * })
 * export class AppModule {}
 * ```
 */
const encryptionConfig = IdefineConfig({
  key: process.env.APP_KEY ?? '',
  cipher: 'aes-256-gcm',
  previousKeys: [],
});

export default encryptionConfig;
