/**
 * @file encrypted-config.interface.ts
 * @module @stackra/orm/src/interfaces
 * @description IEncryptedConfig interface.
 */

/**
 * Configuration for the @Encrypted() trait.
 */
export interface IEncryptedConfig {
  /** Field names to encrypt/decrypt. */
  fields: string[];
  /** Whether decryption happens lazily (on access) vs eagerly (on load). Default: eager. */
  lazy?: boolean;
}
