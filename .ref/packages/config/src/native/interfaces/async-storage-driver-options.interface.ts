/**
 * @file async-storage-driver-options.interface.ts
 * @module @stackra/config/src/interfaces
 * @description IAsyncStorageDriverOptions interface.
 */

/**
 * Options for the AsyncStorage config driver.
 */
export interface IAsyncStorageDriverOptions {
  /** AsyncStorage instance to use. */
  storage: IAsyncStorageAdapter;
  /** Prefix for keys stored in AsyncStorage. Default: '@config:'. */
  prefix?: string;
  /**
   * Schema version string. When the stored version does not match,
   * all stale config keys are cleared before loading fresh values.
   * Useful for migrating config shape across app updates.
   */
  version?: string;
}
