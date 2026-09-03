/**
 * @file bundled-config.driver.ts
 * @module @stackra/config/native/drivers
 * @description Read-only driver that reads from a JSON object bundled
 *   into the app binary at build time.
 */

import type { IConfigDriver } from '@stackra/contracts';

// ════════════════════════════════════════════════════════════════════════════════
// Driver
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Bundled config driver (read-only).
 *
 * Reads from a JSON object that was bundled into the app binary at build time.
 * Typically used for static app configuration that doesn't change at runtime.
 *
 * @example
 * ```typescript
 * // Import the bundled JSON (Metro resolves at build time)
 * import bundledConfig from '../config/app.config.json';
 *
 * const driver = new BundledConfigDriver(bundledConfig);
 * const appName = driver.get('app.name');
 * ```
 */
export class BundledConfigDriver implements IConfigDriver {
  /** The frozen bundled config data. */
  private readonly config: Record<string, unknown>;

  /**
   * @param data - The bundled JSON config object
   */
  public constructor(data: Record<string, unknown>) {
    this.config = structuredClone(data);
  }

  /**
   * Get a value by key with dot-notation support.
   *
   * @typeParam T - Expected return type
   * @param key - Config key
   * @param defaultValue - Fallback
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
   * @returns True if present
   */
  public has(key: string): boolean {
    return this.getNestedValue(key) !== undefined;
  }

  /**
   * Get all bundled config values.
   *
   * @returns A copy of the bundled config
   */
  public all(): Record<string, unknown> {
    return structuredClone(this.config);
  }

  /**
   * Set is not supported (read-only driver).
   *
   * @throws Error always
   */
  public set(_key: string, _value: unknown): void {
    throw new Error('BundledConfigDriver is read-only. Cannot call set().');
  }

  /**
   * Delete is not supported (read-only driver).
   *
   * @throws Error always
   */
  public delete(_key: string): void {
    throw new Error('BundledConfigDriver is read-only. Cannot call delete().');
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
