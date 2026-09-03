/**
 * @file async-storage.driver.ts
 * @module @stackra/config/native/drivers
 * @description AsyncStorage-backed config driver for React Native.
 *   Persists config changes to AsyncStorage and reloads on app restart.
 */

import type { IConfigDriver } from '@stackra/contracts';

// ════════════════════════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════════════
// Driver
// ════════════════════════════════════════════════════════════════════════════════

/**
 * AsyncStorage config driver for React Native.
 *
 * Persists config changes to AsyncStorage, making them available
 * across app restarts. Supports full CRUD with dot-notation access.
 *
 * @example
 * ```typescript
 * import AsyncStorage from '@react-native-async-storage/async-storage';
 *
 * const driver = new AsyncStorageDriver({
 *   storage: AsyncStorage,
 *   prefix: '@myapp:config:',
 * });
 * await driver.load();
 *
 * driver.get('theme.mode'); // 'dark'
 * driver.set('theme.mode', 'light'); // Persists to AsyncStorage
 * ```
 */
export class AsyncStorageDriver implements IConfigDriver {
  /** In-memory cache of config values. */
  private config: Record<string, unknown> = {};

  /** Storage key prefix. */
  private readonly prefix: string;

  /** AsyncStorage adapter. */
  private readonly storage: IAsyncStorageAdapter;

  /** Schema version for migration detection. */
  private readonly version: string | undefined;

  /** Whether initial load has been performed. */
  private _loaded = false;

  /** Check if driver has completed initial load. */
  public get isLoaded(): boolean {
    return this._loaded;
  }

  /**
   * @param options - Driver options with AsyncStorage instance
   */
  public constructor(options: IAsyncStorageDriverOptions) {
    this.storage = options.storage;
    this.prefix = options.prefix ?? '@config:';
    this.version = options.version;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Load
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Load all config from AsyncStorage into memory.
   *
   * When a `version` is configured, compares the stored version against
   * the current version. On mismatch, clears all stale keys and persists
   * the new version marker before proceeding with a fresh load.
   */
  public async load(): Promise<void> {
    // Version migration: clear stale config on version mismatch
    if (this.version) {
      const versionKey = `${this.prefix}__version__`;
      const storedVersion = await this.storage.getItem(versionKey);

      if (storedVersion !== this.version) {
        await this.clear();
        await this.storage.setItem(versionKey, this.version);
      }
    }

    const allKeys = await this.storage.getAllKeys();
    const configKeys = allKeys.filter(
      (k) => k.startsWith(this.prefix) && !k.endsWith('__version__')
    );

    if (configKeys.length === 0) {
      this._loaded = true;
      return;
    }

    const pairs = await this.storage.multiGet(configKeys);

    for (const [key, value] of pairs) {
      const cleanKey = key.slice(this.prefix.length);
      try {
        this.config[cleanKey] = value ? JSON.parse(value) : undefined;
      } catch {
        this.config[cleanKey] = value;
      }
    }

    this._loaded = true;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // IConfigDriver
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Get a value by key with dot-notation support.
   *
   * @typeParam T - Expected return type
   * @param key - Config key
   * @param defaultValue - Fallback value
   * @returns The value or default
   */
  public get<T = unknown>(key: string, defaultValue?: T): T | undefined {
    const value = this.getNestedValue(key);
    return (value !== undefined ? value : defaultValue) as T | undefined;
  }

  /**
   * Check if a key exists.
   *
   * @param key - Config key
   * @returns True if the key exists
   */
  public has(key: string): boolean {
    return this.getNestedValue(key) !== undefined;
  }

  /**
   * Get all config values.
   *
   * @returns A copy of all config data
   */
  public all(): Record<string, unknown> {
    return { ...this.config };
  }

  /**
   * Set a value and persist to AsyncStorage.
   *
   * @param key - Config key
   * @param value - Value to set
   */
  public set(key: string, value: unknown): void {
    this.config[key] = value;
    // Fire-and-forget persist
    this.storage.setItem(`${this.prefix}${key}`, JSON.stringify(value)).catch(() => {
      /* fail silently */
    });
  }

  /**
   * Delete a value and remove from AsyncStorage.
   *
   * @param key - Config key to remove
   */
  public delete(key: string): void {
    delete this.config[key];
    this.storage.removeItem(`${this.prefix}${key}`).catch(() => {
      /* fail silently */
    });
  }

  /**
   * Merge values into config and persist.
   *
   * @param config - Values to merge
   */
  public merge(config: Record<string, unknown>): void {
    for (const [key, value] of Object.entries(config)) {
      this.set(key, value);
    }
  }

  /**
   * Clear all config keys from AsyncStorage (under this prefix) and memory.
   * Preserves the version marker key if version migration is enabled.
   */
  public async clear(): Promise<void> {
    const allKeys = await this.storage.getAllKeys();
    const configKeys = allKeys.filter((k) => k.startsWith(this.prefix));

    for (const key of configKeys) {
      await this.storage.removeItem(key);
    }

    this.config = {};
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Private
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Resolve a dot-notation key.
   */
  private getNestedValue(key: string): unknown {
    if (key in this.config) return this.config[key];

    const parts = key.split('.');
    let current: unknown = this.config;

    for (const part of parts) {
      if (current === null || current === undefined || typeof current !== 'object') {
        return undefined;
      }
      current = (current as Record<string, unknown>)[part];
    }

    return current;
  }
}
