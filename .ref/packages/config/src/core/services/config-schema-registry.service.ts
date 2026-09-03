/**
 * @file config-schema-registry.service.ts
 * @module @stackra/config/core/services
 * @description Central registry for config key metadata.
 *   Collects schema entries from defineConfig/registerAs factories
 *   and provides lookup, listing, and export capabilities.
 */

import { IInjectable } from '@stackra/ts-container';
import type { IConfigSchemaEntry } from '@stackra/contracts';

// ════════════════════════════════════════════════════════════════════════════════
// Service
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Config schema registry — central catalog of all config keys.
 *
 * Stores metadata about every known config key including its type,
 * default value, description, owning package, and deprecation status.
 * Used for documentation, admin endpoints, and .d.ts generation.
 *
 * @example
 * ```typescript
 * const registry = app.get(ConfigSchemaRegistry);
 * registry.register({
 *   path: 'database.host',
 *   type: 'string',
 *   default: 'localhost',
 *   description: 'Database server hostname',
 *   sensitive: false,
 *   owner: '@stackra/nestjs-orm',
 * });
 *
 * const entry = registry.get('database.host');
 * const all = registry.list();
 * ```
 */
@IInjectable()
export class ConfigSchemaRegistry {
  /** Internal registry of schema entries keyed by dot-notation path. */
  private readonly entries: Map<string, IConfigSchemaEntry> = new Map();

  /**
   * Register a config schema entry.
   *
   * @param entry - The schema entry to register
   */
  public register(entry: IConfigSchemaEntry): void {
    this.entries.set(entry.path, entry);
  }

  /**
   * Register multiple schema entries at once.
   *
   * @param entries - Array of schema entries to register
   */
  public registerMany(entries: IConfigSchemaEntry[]): void {
    for (const entry of entries) {
      this.entries.set(entry.path, entry);
    }
  }

  /**
   * Get a schema entry by path.
   *
   * @param path - Dot-notation config key path
   * @returns The schema entry or undefined if not registered
   */
  public get(path: string): IConfigSchemaEntry | undefined {
    return this.entries.get(path);
  }

  /**
   * Check if a path is registered in the schema.
   *
   * @param path - Dot-notation config key path
   * @returns True if the path is registered
   */
  public has(path: string): boolean {
    return this.entries.has(path);
  }

  /**
   * List all registered schema entries.
   *
   * @returns Array of all schema entries
   */
  public list(): IConfigSchemaEntry[] {
    return Array.from(this.entries.values());
  }

  /**
   * List entries filtered by owner package.
   *
   * @param owner - Package name to filter by
   * @returns Entries belonging to the specified package
   */
  public listByOwner(owner: string): IConfigSchemaEntry[] {
    return this.list().filter((entry) => entry.owner === owner);
  }

  /**
   * List entries that are marked as sensitive.
   *
   * @returns Entries with `sensitive: true`
   */
  public listSensitive(): IConfigSchemaEntry[] {
    return this.list().filter((entry) => entry.sensitive);
  }

  /**
   * List entries that are deprecated.
   *
   * @returns Entries with a `deprecated` value
   */
  public listDeprecated(): IConfigSchemaEntry[] {
    return this.list().filter((entry) => entry.deprecated !== undefined);
  }

  /**
   * Export the registry as a JSON-serializable object.
   *
   * @returns Object keyed by path with schema entry values
   */
  public toJSON(): Record<string, IConfigSchemaEntry> {
    const result: Record<string, IConfigSchemaEntry> = {};
    for (const [path, entry] of this.entries) {
      result[path] = entry;
    }
    return result;
  }

  /**
   * Get total number of registered entries.
   *
   * @returns Entry count
   */
  public count(): number {
    return this.entries.size;
  }

  /**
   * Clear all registered entries.
   */
  public clear(): void {
    this.entries.clear();
  }
}
