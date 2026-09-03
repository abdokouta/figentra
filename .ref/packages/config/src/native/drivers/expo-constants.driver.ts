/**
 * @file expo-constants.driver.ts
 * @module @stackra/config/native/drivers
 * @description Read-only driver that reads from Expo Constants manifest.
 */

import type { IConfigDriver } from '@stackra/contracts';

// ════════════════════════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════════════
// Driver
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Expo Constants config driver (read-only).
 *
 * Reads from `expo-constants` manifest values (expoConfig.extra and manifest).
 * Typically used for build-time values injected via app.config.js/app.json.
 *
 * @example
 * ```typescript
 * import Constants from 'expo-constants';
 *
 * const driver = new ExpoConstantsDriver(Constants);
 * const apiUrl = driver.get('apiUrl');
 * ```
 */
export class ExpoConstantsDriver implements IConfigDriver {
  /** Merged config from Expo Constants. */
  private readonly config: Record<string, unknown>;

  /**
   * @param constants - Expo Constants object
   */
  public constructor(constants: IExpoConstants) {
    this.config = {
      ...(constants.manifest ?? {}),
      ...(constants.expoConfig?.extra ?? {}),
    };
  }

  /**
   * Get a value by key.
   *
   * @typeParam T - Expected return type
   * @param key - Config key
   * @param defaultValue - Fallback
   * @returns The value or default
   */
  public get<T = unknown>(key: string, defaultValue?: T): T | undefined {
    const value = this.config[key];
    return (value !== undefined ? value : defaultValue) as T | undefined;
  }

  /**
   * Check if a key exists.
   *
   * @param key - Config key
   * @returns True if present
   */
  public has(key: string): boolean {
    return key in this.config;
  }

  /**
   * Get all values.
   *
   * @returns A copy of all constants
   */
  public all(): Record<string, unknown> {
    return { ...this.config };
  }

  /**
   * Set is not supported (read-only driver).
   *
   * @throws Error always
   */
  public set(_key: string, _value: unknown): void {
    throw new Error('ExpoConstantsDriver is read-only. Cannot call set().');
  }

  /**
   * Delete is not supported (read-only driver).
   *
   * @throws Error always
   */
  public delete(_key: string): void {
    throw new Error('ExpoConstantsDriver is read-only. Cannot call delete().');
  }
}
