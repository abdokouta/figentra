/**
 * @file config-service-options.interface.ts
 * @module @stackra/config/src/interfaces
 * @description IConfigServiceOptions interface.
 */

/**
 * Options passed to ConfigService at construction.
 */
export interface IConfigServiceOptions {
  /** Keys to mark as sensitive for redaction. */
  sensitiveKeys?: string[];
  /** Encryption key for encrypted config values. */
  encryptionKey?: string;
  /** Event emitter interface (optional). */
  eventEmitter?: IConfigEventEmitter;
}
