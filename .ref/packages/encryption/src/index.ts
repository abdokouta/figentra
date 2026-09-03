/**
 * @file index.ts
 * @module @stackra/nestjs-encryption
 * @description Public API for the @stackra/nestjs-encryption package.
 *   AES-256-GCM and AES-256-CBC encryption with key rotation support,
 *   pluggable drivers, and ORM integration via the @Encrypted() decorator.
 */

// ════════════════════════════════════════════════════════════════════════════════
// Module
// ════════════════════════════════════════════════════════════════════════════════
export { NestEncryptionModule } from './nest-encryption.module';

// ════════════════════════════════════════════════════════════════════════════════
// Services
// ════════════════════════════════════════════════════════════════════════════════
export { EncryptionService, EncryptionFactory } from './services';

// ════════════════════════════════════════════════════════════════════════════════
// Drivers
// ════════════════════════════════════════════════════════════════════════════════
export { BaseEncryptionDriver, AesCbcDriver, AesGcmDriver } from './drivers';

// ════════════════════════════════════════════════════════════════════════════════
// Decorators
// ════════════════════════════════════════════════════════════════════════════════
export {
  InjectEncryption,
  Encrypted,
  getEncryptedFields,
  ENCRYPTED_METADATA_KEY,
} from './decorators';

// ════════════════════════════════════════════════════════════════════════════════
// Enums
// ════════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════════════════════════
export type { IEncryptedPayload } from './types';

// ════════════════════════════════════════════════════════════════════════════════
// Constants
// ════════════════════════════════════════════════════════════════════════════════
export { ENCRYPTION_SERVICE, DEFAULT_ENCRYPTION_CONFIG } from './constants';

// ════════════════════════════════════════════════════════════════════════════════
// Interfaces
// ════════════════════════════════════════════════════════════════════════════════
export type {
  IEncryptionConfig,
  IEncryptionModuleAsyncOptions,
  EncryptionCipher,
  IEncryptionDriver,
} from './interfaces';

// ════════════════════════════════════════════════════════════════════════════════
// Errors
// ════════════════════════════════════════════════════════════════════════════════
export { EncryptionError, DecryptionError, InvalidKeyError } from './errors';

// ════════════════════════════════════════════════════════════════════════════════
// Utilities
// ════════════════════════════════════════════════════════════════════════════════
export { defineConfig, generateIv, generateKey, supported, CIPHER_KEY_SIZES } from './utils';
