/**
 * @file env.driver.ts
 * @module @stackra/config/core/services
 * @description Environment variable config driver.
 *   Reads from process.env or browser globals with dot-notation support,
 *   prefix stripping, and variable expansion.
 */

import type { IConfigDriver } from '@stackra/contracts';
import { getNestedValue, hasNestedValue } from '../utils';

// ════════════════════════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════════════
// Driver
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Environment variable config driver.
 *
 * Reads configuration from `process.env` or a browser-injected global.
 * Supports automatic framework prefix stripping (VITE_, NEXT_PUBLIC_)
 * and variable expansion (`${VAR}` syntax).
 *
 * @example
 * ```typescript
 * const driver = new EnvDriver({ envPrefix: 'VITE_' });
 * driver.load();
 * const appName = driver.get('APP_NAME', 'MyApp');
 * ```
 */
export class EnvDriver implements IConfigDriver {
  /** Internal configuration store. */
  private config: Record<string, unknown> = {};

  /** Guard flag to prevent redundant loads. */
  private loaded = false;

  /**
   * @param options - Driver configuration options
   */
  public constructor(private readonly options: IEnvDriverOptions = {}) {}

  // ══════════════════════════════════════════════════════════════════════════════
  // Load
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Load environment variables into the internal config store.
   *
   * On first call, reads from browser global or `process.env`,
   * applies prefix stripping and variable expansion, then caches.
   * Subsequent calls are no-ops.
   */
  public load(): void {
    if (this.loaded) {
      return;
    }

    const globalName = this.options.globalName ?? '__APP_CONFIG__';

    // Try browser global first, then process.env
    if (typeof window !== 'undefined' && (window as any)[globalName]) {
      this.config = { ...(window as any)[globalName] };
    } else if (typeof process !== 'undefined' && process.env) {
      this.config = { ...process.env };
    }

    // Strip prefix if configured
    if (this.options.envPrefix !== false) {
      this.stripPrefix();
    }

    // Expand variables if enabled
    if (this.options.expandVariables) {
      this.expandEnvVariables();
    }

    this.loaded = true;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // IConfigDriver
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Get a configuration value by key.
   *
   * Lazily triggers `load()` on first access. Supports dot-notation
   * for nested values.
   *
   * @typeParam T - Expected return type
   * @param key - Configuration key (supports dot notation)
   * @param defaultValue - Fallback value if key not found
   * @returns The value or default
   */
  public get<T = unknown>(key: string, defaultValue?: T): T | undefined {
    if (!this.loaded) {
      this.load();
    }
    return getNestedValue<T>(this.config as Record<string, unknown>, key, defaultValue);
  }

  /**
   * Check if a configuration key exists.
   *
   * @param key - Configuration key (supports dot notation)
   * @returns True if the key exists
   */
  public has(key: string): boolean {
    if (!this.loaded) {
      this.load();
    }
    return hasNestedValue(this.config as Record<string, unknown>, key);
  }

  /**
   * Get all configuration values.
   *
   * @returns A shallow copy of all configuration data
   */
  public all(): Record<string, unknown> {
    if (!this.loaded) {
      this.load();
    }
    return { ...this.config };
  }

  /**
   * Set a configuration value at runtime.
   *
   * @param key - Configuration key
   * @param value - Value to set
   */
  public set(key: string, value: unknown): void {
    if (!this.loaded) {
      this.load();
    }
    this.config[key] = value;
  }

  /**
   * Delete a configuration value.
   *
   * @param key - Configuration key to remove
   */
  public delete(key: string): void {
    if (!this.loaded) {
      this.load();
    }
    delete this.config[key];
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Merge
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Merge additional configuration into the internal store.
   *
   * Used by ConfigManager to merge custom `load` config on top
   * of the driver's loaded values.
   *
   * @param config - Configuration object to merge
   */
  public merge(config: Record<string, unknown>): void {
    Object.assign(this.config, config);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Private Helpers
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Expand `${VAR}` references within configuration values.
   */
  private expandEnvVariables(): void {
    const regex = /\$\{([^}]+)\}/g;

    for (const [key, value] of Object.entries(this.config)) {
      if (typeof value === 'string' && value.includes('${')) {
        this.config[key] = value.replace(regex, (_, ref) => {
          return String(this.config[ref] ?? '');
        });
      }
    }
  }

  /**
   * Strip environment variable prefixes from configuration keys.
   *
   * Auto-detects the framework prefix (VITE_, NEXT_PUBLIC_) when
   * envPrefix is 'auto' or undefined.
   */
  private stripPrefix(): void {
    let prefix = this.options.envPrefix;

    // Auto-detect framework prefix
    if (prefix === undefined) {
      const keys = Object.keys(this.config);
      if (keys.some((key) => key.startsWith('VITE_'))) {
        prefix = 'VITE_';
      } else if (keys.some((key) => key.startsWith('NEXT_PUBLIC_'))) {
        prefix = 'NEXT_PUBLIC_';
      } else {
        return;
      }
    }

    if (typeof prefix === 'string' && prefix.length > 0) {
      const newConfig: Record<string, unknown> = {};

      for (const [key, value] of Object.entries(this.config)) {
        if (key.startsWith(prefix)) {
          const unprefixedKey = key.substring(prefix.length);
          newConfig[unprefixedKey] = value;
          newConfig[key] = value;
        } else {
          newConfig[key] = value;
        }
      }

      this.config = newConfig;
    }
  }
}
