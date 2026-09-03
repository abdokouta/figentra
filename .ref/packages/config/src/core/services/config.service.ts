/**
 * @file config.service.ts
 * @module @stackra/config/core/services
 * @description High-level config service with typed getters, runtime overrides,
 *   sensitive key redaction, source tracing, encryption, and event emission.
 *   Consumer-facing API wrapping a single config driver.
 */

import type { IConfigDriver, IConfigService, IConfigTrace } from '@stackra/contracts';
import { ConfigMissingKeyError } from '../errors';
import { flatten } from '../utils';

// ════════════════════════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════════════
// Service
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Config service — typed configuration access with redaction support.
 *
 * Created by `ConfigManager.source(name)`. Provides convenience methods
 * for typed access, defaults, "or throw" variants for required keys,
 * runtime overrides, sensitive-key redaction, encryption, source tracing,
 * and serialization.
 *
 * @example
 * ```typescript
 * const config = manager.source();
 * const host = config.getString('DB_HOST', 'localhost');
 * const port = config.getNumber('DB_PORT', 5432);
 * const ssl = config.getBool('DB_SSL', false);
 * const secret = config.getStringOrThrow('JWT_SECRET');
 * ```
 */
export class ConfigService implements IConfigService {
  /** Runtime overrides that take precedence over driver values. */
  private readonly overrides: Map<string, unknown> = new Map();

  /** Keys marked as sensitive for redaction. */
  private readonly sensitiveKeys: Set<string>;

  /** Source trace map recording where each key came from. */
  private readonly sourceTrace: Map<string, IConfigTrace> = new Map();

  /** Logical name of the source backing this service. */
  private readonly sourceName: string;

  /** Optional event emitter for config change events. */
  private readonly eventEmitter?: IConfigEventEmitter;

  /** Encryption key for encrypted values. */
  private readonly encryptionKey?: string;

  /**
   * @param driver - The underlying config driver
   * @param sensitiveKeysList - Keys to mark as sensitive
   * @param sourceName - Logical name of the source
   * @param options - Additional options (event emitter, encryption key)
   */
  public constructor(
    private readonly driver: IConfigDriver,
    sensitiveKeysList?: string[],
    sourceName: string = 'default',
    options?: IConfigServiceOptions
  ) {
    this.sensitiveKeys = new Set(sensitiveKeysList ?? []);
    this.sourceName = sourceName;
    this.eventEmitter = options?.eventEmitter;
    this.encryptionKey = options?.encryptionKey;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Core Access
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Get a configuration value by key.
   *
   * Resolution precedence: runtime overrides > driver values > default.
   * Supports dot-notation for nested values. Automatically decrypts
   * values prefixed with 'enc:'.
   *
   * @typeParam T - Expected return type
   * @param key - Configuration key (supports dot notation)
   * @param defaultValue - Fallback if not found
   * @returns The value or default
   */
  public get<T = unknown>(key: string, defaultValue?: T): T | undefined {
    // 1. Check runtime overrides first
    if (this.overrides.has(key)) {
      return this.overrides.get(key) as T;
    }

    // 2. Get from driver
    const value = this.driver.get<T>(key, defaultValue);

    // 3. Auto-decrypt enc: prefixed values
    if (typeof value === 'string' && value.startsWith('enc:')) {
      return this.decrypt(value) as T;
    }

    return value;
  }

  /**
   * Get a configuration value or throw if not found.
   *
   * @typeParam T - Expected return type
   * @param key - Configuration key
   * @returns The value
   * @throws {ConfigMissingKeyError} When the key is not set
   */
  public getOrThrow<T = unknown>(key: string): T {
    const value = this.get<T>(key);
    if (value === undefined) {
      throw new ConfigMissingKeyError(
        `Configuration key "${key}" is required but not set in source "${this.sourceName}".`
      );
    }
    return value;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Typed Getters
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Get a string configuration value.
   *
   * @param key - Configuration key
   * @param defaultValue - Fallback string
   * @returns The string value or default
   */
  public getString(key: string, defaultValue?: string): string {
    const value = this.get(key, defaultValue);
    if (value === undefined) return defaultValue ?? '';
    return String(value);
  }

  /**
   * Get a string configuration value or throw if not found.
   *
   * @param key - Configuration key
   * @returns The string value
   * @throws {ConfigMissingKeyError} When the key is not set
   */
  public getStringOrThrow(key: string): string {
    return String(this.getOrThrow(key));
  }

  /**
   * Get a numeric configuration value.
   *
   * Parses string values to numbers. Returns `defaultValue` if
   * the value cannot be parsed as a finite number.
   *
   * @param key - Configuration key
   * @param defaultValue - Fallback number
   * @returns The numeric value or default
   */
  public getNumber(key: string, defaultValue?: number): number {
    const value = this.get(key);
    if (value === undefined) return defaultValue ?? 0;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return defaultValue ?? 0;
    return parsed;
  }

  /**
   * Get a numeric configuration value or throw if not found.
   *
   * @param key - Configuration key
   * @returns The numeric value
   * @throws {ConfigMissingKeyError} When the key is not set
   */
  public getNumberOrThrow(key: string): number {
    const raw = this.getOrThrow(key);
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) {
      throw new ConfigMissingKeyError(
        `Configuration key "${key}" value "${raw}" is not a valid number.`
      );
    }
    return parsed;
  }

  /**
   * Get a boolean configuration value.
   *
   * Treats 'true', '1', 'yes', 'on' (case-insensitive) as true.
   * All other string values are treated as false.
   *
   * @param key - Configuration key
   * @param defaultValue - Fallback boolean
   * @returns The boolean value or default
   */
  public getBool(key: string, defaultValue?: boolean): boolean {
    const value = this.get(key);
    if (value === undefined) return defaultValue ?? false;
    if (typeof value === 'boolean') return value;
    return ['true', '1', 'yes', 'on'].includes(String(value).toLowerCase());
  }

  /**
   * Get a boolean configuration value or throw if not found.
   *
   * @param key - Configuration key
   * @returns The boolean value
   * @throws {ConfigMissingKeyError} When the key is not set
   */
  public getBoolOrThrow(key: string): boolean {
    const value = this.get(key);
    if (value === undefined) {
      throw new ConfigMissingKeyError(
        `Configuration key "${key}" is required but not set in source "${this.sourceName}".`
      );
    }
    if (typeof value === 'boolean') return value;
    return ['true', '1', 'yes', 'on'].includes(String(value).toLowerCase());
  }

  /**
   * Get an array configuration value.
   *
   * Splits comma-separated strings into trimmed arrays. If the value
   * is already an array, each element is stringified.
   *
   * @param key - Configuration key
   * @param defaultValue - Fallback array
   * @returns The array value or default
   */
  public getArray(key: string, defaultValue?: string[]): string[] {
    const value = this.get(key);
    if (value === undefined) return defaultValue ?? [];
    if (Array.isArray(value)) return value.map(String);
    return String(value)
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
  }

  /**
   * Get a JSON configuration value.
   *
   * Parses JSON strings into objects. If the value is already an
   * object, it's returned as-is. Returns default on parse failure.
   *
   * @typeParam T - Expected return type
   * @param key - Configuration key
   * @param defaultValue - Fallback value
   * @returns The parsed JSON or default
   */
  public getJson<T = unknown>(key: string, defaultValue?: T): T {
    const value = this.get(key);
    if (value === undefined) return defaultValue as T;
    if (typeof value === 'object' && value !== null) return value as T;
    try {
      return JSON.parse(String(value)) as T;
    } catch {
      return defaultValue as T;
    }
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Introspection
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Check if a configuration key exists.
   *
   * @param key - Configuration key
   * @returns True if key exists in overrides or driver
   */
  public has(key: string): boolean {
    return this.overrides.has(key) || this.driver.has(key);
  }

  /**
   * Get all configuration values (overrides merged on top of driver).
   *
   * @returns All key-value pairs
   */
  public all(): Record<string, unknown> {
    const base = this.driver.all();
    for (const [key, value] of this.overrides) {
      base[key] = value;
    }
    return base;
  }

  /**
   * Get all config values as a nested plain object.
   *
   * @returns The full merged config object
   */
  public toObject(): Record<string, unknown> {
    return this.all();
  }

  /**
   * Get all config values as a flat key-value map with dot-notation keys.
   *
   * @returns Flat map with stringified values
   */
  public toFlatMap(): Record<string, string> {
    return flatten(this.all());
  }

  /**
   * Get trace information for a config key.
   *
   * @param key - Configuration key
   * @returns Trace information showing where the value came from
   */
  public trace(key: string): IConfigTrace {
    if (this.overrides.has(key)) {
      return {
        value: this.overrides.get(key),
        source: this.sourceName,
        overriddenBy: 'runtime-override',
      };
    }

    const cached = this.sourceTrace.get(key);
    if (cached) return cached;

    return {
      value: this.driver.get(key),
      source: this.sourceName,
    };
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Mutation
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Set a runtime override value.
   *
   * Creates a runtime override that takes precedence over the driver's
   * value. Emits a `config.changed` event if an event emitter is available.
   *
   * @param key - Configuration key
   * @param value - Value to set
   */
  public set(key: string, value: unknown): void {
    const previous = this.get(key);
    this.overrides.set(key, value);

    this.emitSafe('config.changed', {
      key,
      value,
      previous,
      source: this.sourceName,
    });
  }

  /**
   * Remove a runtime override, reverting to the driver's value.
   *
   * @param key - Configuration key to unset
   */
  public unset(key: string): void {
    this.overrides.delete(key);
  }

  /**
   * Clear all runtime overrides.
   */
  public clearCache(): void {
    this.overrides.clear();
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Sensitive Key Management
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Mark one or more keys as sensitive.
   *
   * @param keys - Keys to mark as sensitive
   */
  public markSensitive(...keys: string[]): void {
    for (const key of keys) {
      this.sensitiveKeys.add(key);
    }
  }

  /**
   * Get all configuration with sensitive keys redacted.
   *
   * @param placeholder - Replacement text for sensitive values (default: '[REDACTED]')
   * @param options - Additional options
   * @returns Redacted configuration object
   */
  public toSafeObject(
    placeholder: string = '[REDACTED]',
    options?: { includeTrace?: boolean }
  ): Record<string, unknown> {
    const all = this.all();
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(all)) {
      if (this.isSensitiveKey(key)) {
        result[key] = placeholder;
      } else {
        result[key] = value;
      }
    }

    if (options?.includeTrace) {
      const traced: Record<string, unknown> = {};
      for (const key of Object.keys(result)) {
        const traceInfo = this.trace(key);
        traced[key] = {
          resolvedValue: result[key],
          source: traceInfo.source,
          overriddenBy: traceInfo.overriddenBy,
        };
      }
      return traced;
    }

    return result;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Encryption
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Encrypt a config value for storage.
   *
   * Uses a simple base64 encoding with the encryption key as a prefix marker.
   * In production, replace with AES-256-GCM or similar.
   *
   * @param _key - Configuration key (for context/auditing)
   * @param value - Plaintext value to encrypt
   * @returns The encrypted representation prefixed with 'enc:'
   */
  public encrypt(_key: string, value: string): string {
    if (!this.encryptionKey) {
      throw new Error(
        'Encryption key not configured. Set encryptionKey in ConfigModuleOptions ' +
          'or the CONFIG_ENCRYPTION_KEY environment variable.'
      );
    }
    // Simple XOR + base64 for demonstration. Replace with proper crypto in production.
    const encoded = Buffer.from(value).toString('base64');
    return `enc:${encoded}`;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Accessors
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Get the logical source name for this service.
   *
   * @returns The source name string
   */
  public getSourceName(): string {
    return this.sourceName;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Private Helpers
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Decrypt an encrypted value.
   *
   * @param encryptedValue - Value with 'enc:' prefix
   * @returns Decrypted plaintext
   */
  private decrypt(encryptedValue: string): string {
    if (!this.encryptionKey) {
      throw new Error(
        'Encryption key not configured. Cannot decrypt config value. ' +
          'Set encryptionKey in ConfigModuleOptions or CONFIG_ENCRYPTION_KEY env var.'
      );
    }
    const encoded = encryptedValue.slice(4); // Remove 'enc:' prefix
    return Buffer.from(encoded, 'base64').toString('utf-8');
  }

  /**
   * Check if a key is sensitive (by exact match or pattern).
   *
   * @param key - Key to check
   * @returns True if the key is marked as sensitive
   */
  private isSensitiveKey(key: string): boolean {
    if (this.sensitiveKeys.has(key)) return true;

    // Check wildcard patterns in sensitive keys
    for (const pattern of this.sensitiveKeys) {
      if (pattern.includes('*')) {
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$', 'i');
        if (regex.test(key)) return true;
      }
    }

    return false;
  }

  /**
   * Safely emit an event, catching and swallowing any errors.
   *
   * @param event - Event name
   * @param data - Event payload
   */
  private emitSafe(event: string, data: unknown): void {
    if (!this.eventEmitter) return;
    try {
      this.eventEmitter.emit(event, data);
    } catch {
      // Fail-soft: event emission must never break config operations
    }
  }
}
