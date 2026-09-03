/**
 * @file base-registry.ts
 * @module @stackra/ts-support
 * @description Abstract base registry for typed extensible collections.
 *   Provides a Map-backed storage with register/get/has/remove/all/clear/count
 *   operations. Subclass to create domain-specific registries.
 */

// ════════════════════════════════════════════════════════════════════════════════
// BaseRegistry Class
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Abstract base class for typed registries.
 *
 * Provides a generic Map-backed collection with standard CRUD operations.
 * Subclass this to create domain-specific registries (themes, routes,
 * validators, drivers, etc.) with typed keys and values.
 *
 * @typeParam TKey - The type of registry keys (usually string or symbol)
 * @typeParam TValue - The type of registry values
 *
 * @example
 * ```typescript
 * import { BaseRegistry } from '@stackra/ts-support';
 *
 * interface IValidator {
 *   validate(value: unknown): boolean;
 * }
 *
 * class ValidatorRegistry extends BaseRegistry<string, IValidator> {
 *   // Add domain-specific methods if needed
 *   public validate(name: string, value: unknown): boolean {
 *     const validator = this.get(name);
 *     if (!validator) throw new Error(`Validator [${name}] not found.`);
 *     return validator.validate(value);
 *   }
 * }
 *
 * const registry = new ValidatorRegistry();
 * registry.register('email', { validate: (v) => typeof v === 'string' && v.includes('@') });
 * registry.has('email');  // true
 * registry.count();       // 1
 * ```
 */
export abstract class BaseRegistry<TKey, TValue> {
  /** Internal Map storage. */
  protected items: Map<TKey, TValue> = new Map();

  // ══════════════════════════════════════════════════════════════════════════
  // Registration
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Register a value under the given key.
   *
   * If the key already exists, it will be overwritten.
   *
   * @param key - The registry key
   * @param value - The value to register
   * @returns this (for chaining)
   *
   * @example
   * ```typescript
   * registry.register('json', new JsonSerializer());
   * ```
   */
  public register(key: TKey, value: TValue): this {
    this.items.set(key, value);
    return this;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Retrieval
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Get a value by key.
   *
   * @param key - The registry key
   * @returns The registered value, or undefined if not found
   *
   * @example
   * ```typescript
   * const serializer = registry.get('json'); // JsonSerializer | undefined
   * ```
   */
  public get(key: TKey): TValue | undefined {
    return this.items.get(key);
  }

  /**
   * Check if a key is registered.
   *
   * @param key - The registry key
   * @returns True if the key exists in the registry
   *
   * @example
   * ```typescript
   * registry.has('json'); // true
   * registry.has('xml');  // false
   * ```
   */
  public has(key: TKey): boolean {
    return this.items.has(key);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Removal
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Remove a value from the registry by key.
   *
   * @param key - The registry key to remove
   * @returns True if the key existed and was removed
   *
   * @example
   * ```typescript
   * registry.remove('json'); // true
   * registry.remove('missing'); // false
   * ```
   */
  public remove(key: TKey): boolean {
    return this.items.delete(key);
  }

  /**
   * Clear all entries from the registry.
   *
   * @returns this (for chaining)
   *
   * @example
   * ```typescript
   * registry.clear();
   * registry.count(); // 0
   * ```
   */
  public clear(): this {
    this.items.clear();
    return this;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Inspection
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Get all registered entries as an array of [key, value] tuples.
   *
   * @returns Array of all registered key-value pairs
   *
   * @example
   * ```typescript
   * const entries = registry.all(); // [['json', {...}], ['xml', {...}]]
   * ```
   */
  public all(): [TKey, TValue][] {
    return Array.from(this.items.entries());
  }

  /**
   * Get the number of registered entries.
   *
   * @returns The count of entries in the registry
   *
   * @example
   * ```typescript
   * registry.count(); // 3
   * ```
   */
  public count(): number {
    return this.items.size;
  }

  /**
   * Get all registered keys.
   *
   * @returns Array of all registered keys
   *
   * @example
   * ```typescript
   * registry.keys(); // ['json', 'xml', 'yaml']
   * ```
   */
  public keys(): TKey[] {
    return Array.from(this.items.keys());
  }

  /**
   * Get all registered values.
   *
   * @returns Array of all registered values
   *
   * @example
   * ```typescript
   * registry.values(); // [JsonSerializer, XmlSerializer, YamlSerializer]
   * ```
   */
  public values(): TValue[] {
    return Array.from(this.items.values());
  }
}
