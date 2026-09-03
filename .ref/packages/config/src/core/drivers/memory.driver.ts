/**
 * @file memory.driver.ts
 * @module @stackra/config/core/services
 * @description In-memory config driver for static configuration objects.
 */

import type { IConfigDriver } from '@stackra/contracts';

// ════════════════════════════════════════════════════════════════════════════════
// Driver
// ════════════════════════════════════════════════════════════════════════════════

/**
 * In-memory config driver.
 *
 * Stores configuration in a plain JavaScript object. Supports dot-notation
 * access for nested values. Useful for testing and static configuration.
 *
 * @example
 * ```typescript
 * const driver = new MemoryDriver({
 *   APP_NAME: 'MyApp',
 *   database: { host: 'localhost', port: 5432 },
 * });
 * const host = driver.get('database.host'); // 'localhost'
 * ```
 */
export class MemoryDriver implements IConfigDriver {
  /** The configuration data store. */
  private data: Record<string, unknown>;

  /**
   * @param initialData - Initial configuration data
   */
  public constructor(initialData: Record<string, unknown> = {}) {
    this.data = { ...initialData };
  }

  /**
   * Get a value by key with dot-notation support.
   *
   * @param key - Configuration key (e.g., 'database.host')
   * @param defaultValue - Fallback value
   * @returns The value or default
   */
  public get<T = unknown>(key: string, defaultValue?: T): T | undefined {
    const value = this.getNestedValue(key);
    return (value !== undefined ? value : defaultValue) as T | undefined;
  }

  /**
   * Check if a key exists with dot-notation support.
   *
   * @param key - Configuration key
   * @returns True if the key exists
   */
  public has(key: string): boolean {
    return this.getNestedValue(key) !== undefined;
  }

  /**
   * Get all configuration values.
   *
   * @returns A shallow copy of all configuration data
   */
  public all(): Record<string, unknown> {
    return { ...this.data };
  }

  /**
   * Set a value with dot-notation support.
   *
   * @param key - Configuration key
   * @param value - Value to set
   */
  public set(key: string, value: unknown): void {
    const parts = key.split('.');
    if (parts.length === 1) {
      this.data[key] = value;
      return;
    }

    let current: Record<string, unknown> = this.data;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i]!;
      if (!(part in current) || typeof current[part] !== 'object') {
        current[part] = {};
      }
      current = current[part] as Record<string, unknown>;
    }
    current[parts[parts.length - 1]!] = value;
  }

  /**
   * Resolve a dot-notation key to its nested value.
   *
   * @param key - Dot-separated key path
   * @returns The resolved value or undefined
   */
  private getNestedValue(key: string): unknown {
    // Try direct key first
    if (key in this.data) {
      return this.data[key];
    }

    // Try dot-notation traversal
    const parts = key.split('.');
    let current: unknown = this.data;

    for (const part of parts) {
      if (current === null || current === undefined || typeof current !== 'object') {
        return undefined;
      }
      current = (current as Record<string, unknown>)[part];
    }

    return current;
  }
}
