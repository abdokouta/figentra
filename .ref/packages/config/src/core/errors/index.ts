/**
 * @file index.ts
 * @module @stackra/config/core/errors
 * @description Barrel export for config error classes.
 */

export { ConfigError } from './config.error';
export { ConfigSourceError } from './config-source.error';
export { ConfigMissingKeyError } from './config-missing-key.error';
export { ConfigValidationError } from './config-validation.error';
export type { IConfigViolation } from './config-validation.error';
export { ConfigEncryptionError } from './config-encryption.error';
