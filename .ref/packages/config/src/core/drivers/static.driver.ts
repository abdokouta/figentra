/**
 * @file static.driver.ts
 * @module @stackra/config/core/services
 * @description Read-only static config driver initialized with a plain object.
 *   Throws on mutation attempts. Useful for compile-time values or
 *   immutable config snapshots.
 */

import type { IConfigDriver } from '@stackra/contracts';
import { getNestedValue, hasNestedValue } from '../utils';

// ════════════════════════════════════════════════════════════════════════════════
// Driver
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Static (read-only) config driver.
 *
 * Initialized with a plain object at construction time. All mutation
 * methods (`set`, `delete`) throw to enforce immutability. Merge is
 * also rejected after construction.
 *
 * @example
 * ```typescript
 * const driver = new StaticDriver({
 *   app: { name: 'MyApp', version: '1.0.0' },
 *   features: { darkMode: true },
 * });
 *
 * driver.get('app.name'); // 'MyApp'
 * driver.set('app.name', 'Other'); // throws!
 * ```
 */
export class StaticDriver implements IConfigDriver {
  /** Frozen configuration snapshot. */
  private readonly data: Record<string, unknown>;

  /**
   * @param config - Configuration object to freeze as the static source
   */
  public constructor(config: Record<string, unknown>) {
    this.data = structuredClone(config);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // IConfigDriver (read operations)
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Get a value by dot-notation key.
   *
   * @typeParam T - Expected return type
   * @param key - Configuration key (supports dot notation)
   * @param defaultValue - Fallback value if not found
   * @returns The value or default
   */
  public get<T = unknown>(key: string, defaultValue?: T): T | undefined {
    return getNestedValue<T>(this.data, key, defaultValue);
  }

  /**
   * Check if a key exists.
   *
   * @param key - Configuration key (supports dot notation)
   * @returns True if the key exists
   */
  public has(key: string): boolean {
    return hasNestedValue(this.data, key);
  }

  /**
   * Get all configuration values as a shallow copy.
   *
   * @returns A copy of the static config data
   */
  public all(): Record<string, unknown> {
    return structuredClone(this.data);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // IConfigDriver (mutation — all throw)
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Set is not supported on the static driver.
   *
   * @throws Error always — static driver is read-only
   */
  public set(_key: string, _value: unknown): void {
    throw new Error('StaticDriver is read-only. Cannot call set() on an immutable config source.');
  }

  /**
   * Delete is not supported on the static driver.
   *
   * @throws Error always — static driver is read-only
   */
  public delete(_key: string): void {
    throw new Error(
      'StaticDriver is read-only. Cannot call delete() on an immutable config source.'
    );
  }

  /**
   * Merge is not supported on the static driver.
   *
   * @throws Error always — static driver is read-only
   */
  public merge(_config: Record<string, unknown>): void {
    throw new Error(
      'StaticDriver is read-only. Cannot call merge() on an immutable config source.'
    );
  }
}
