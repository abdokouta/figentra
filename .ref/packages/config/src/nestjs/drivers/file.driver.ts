/**
 * @file file.driver.ts
 * @module @stackra/config/nestjs/drivers
 * @description File-based config driver (Node.js only).
 *   Scans TypeScript/JavaScript/JSON files from disk using glob patterns,
 *   namespaces them by filename, and merges into a single nested object.
 *   Supports environment-specific overrides and file watching for hot reload.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import type { IConfigDriver } from '@stackra/contracts';
import { ConfigSourceError } from '../../core/errors';

// ════════════════════════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════════════
// Driver
// ════════════════════════════════════════════════════════════════════════════════

/**
 * File-based config driver (Node.js only).
 *
 * Scans a directory for config files and merges them into a single object
 * keyed by filename (without extension). Supports environment-specific
 * overrides where `database.production.ts` overrides `database.ts`.
 *
 * @example
 * ```typescript
 * // Given config/ directory:
 * // config/app.ts       → { name: 'MyApp', port: 3000 }
 * // config/database.ts  → { host: 'localhost', port: 5432 }
 * // config/database.production.ts → { host: 'prod-db.example.com' }
 *
 * const driver = new FileDriver({ configDir: './config', environment: 'production' });
 * await driver.load();
 *
 * driver.get('app.name');       // 'MyApp'
 * driver.get('database.host');  // 'prod-db.example.com' (overridden)
 * ```
 */
export class FileDriver implements IConfigDriver {
  /** Merged config from all files. */
  private config: Record<string, unknown> = {};

  /** File watcher reference (if watching). */
  private watcher: fs.FSWatcher | null = null;

  /** Change callback for hot reload notifications. */
  private onChangeCallback?: (changedKeys: string[]) => void;

  /**
   * @param options - File driver configuration
   */
  public constructor(private readonly options: IFileDriverOptions) {}

  // ══════════════════════════════════════════════════════════════════════════════
  // Load
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Scan the config directory and load all matching files.
   */
  public async load(): Promise<void> {
    const configDir = path.resolve(process.cwd(), this.options.configDir);

    if (!fs.existsSync(configDir)) {
      throw new ConfigSourceError(`Config directory does not exist: ${configDir}`);
    }

    const files = this.scanDirectory(configDir);
    const env = this.options.environment ?? process.env.NODE_ENV ?? 'development';

    // Separate base files from environment-specific ones
    const baseFiles: string[] = [];
    const envFiles: string[] = [];

    for (const file of files) {
      const namespace = this.getNamespace(file);
      // Environment-specific: ends with .{env} after stripping .config
      // e.g., database.production (from database.production.config.ts or database.production.ts)
      if (namespace.endsWith(`.${env}`)) {
        envFiles.push(file);
      } else if (!this.isEnvSpecific(namespace)) {
        baseFiles.push(file);
      }
    }

    // Load base files first
    for (const file of baseFiles) {
      const namespace = this.getNamespace(file);
      const content = await this.loadFile(file);
      this.setNestedByNamespace(namespace, content);
    }

    // Overlay environment-specific files
    for (const file of envFiles) {
      const fullNamespace = this.getNamespace(file);
      // Remove the .{env} suffix to get the base namespace
      const namespace = fullNamespace.replace(`.${env}`, '');
      const content = await this.loadFile(file);

      // Deep merge with existing namespace
      const existing = (this.getNestedByNamespace(namespace) ?? {}) as Record<string, unknown>;
      this.setNestedByNamespace(
        namespace,
        this.deepMerge(existing, content as Record<string, unknown>)
      );
    }

    // Start watching if enabled
    if (this.options.watch) {
      this.startWatching(configDir);
    }
  }

  /**
   * Refresh by re-reading all config files.
   */
  public async refresh(): Promise<void> {
    this.config = {};
    await this.load();
  }

  /**
   * Dispose file watcher.
   */
  public dispose(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }

  /**
   * Register a change callback for hot reload.
   *
   * @param callback - Called with changed namespace keys
   */
  public onChange(callback: (changedKeys: string[]) => void): void {
    this.onChangeCallback = callback;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // IConfigDriver
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Get a value by dot-notation key.
   *
   * @typeParam T - Expected return type
   * @param key - Config key (e.g., 'database.host')
   * @param defaultValue - Fallback
   * @returns The value or default
   */
  public get<T = unknown>(key: string, defaultValue?: T): T | undefined {
    const parts = key.split('.');
    let current: unknown = this.config;

    for (const part of parts) {
      if (current === null || current === undefined || typeof current !== 'object') {
        return defaultValue;
      }
      current = (current as Record<string, unknown>)[part];
    }

    return (current !== undefined ? current : defaultValue) as T | undefined;
  }

  /**
   * Check if a key exists.
   *
   * @param key - Config key (dot notation)
   * @returns True if the key resolves to a defined value
   */
  public has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  /**
   * Get all config as a nested object.
   *
   * @returns All loaded config
   */
  public all(): Record<string, unknown> {
    return { ...this.config };
  }

  /**
   * Set a value in the in-memory config (does NOT persist to file).
   *
   * @param key - Config key
   * @param value - Value to set
   */
  public set(key: string, value: unknown): void {
    const parts = key.split('.');
    if (parts.length === 1) {
      this.config[key] = value;
      return;
    }

    let current: Record<string, unknown> = this.config;
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
   * Merge additional config.
   *
   * @param config - Values to merge
   */
  public merge(config: Record<string, unknown>): void {
    this.config = this.deepMerge(this.config, config);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Private Helpers
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Scan a directory for config files.
   */
  private scanDirectory(dir: string): string[] {
    const results: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const extensions = ['.ts', '.js', '.mjs', '.json'];
    const excludeDirs = this.options.excludeDirs ?? ['node_modules', '.git'];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (!excludeDirs.includes(entry.name)) {
          results.push(...this.scanDirectory(path.join(dir, entry.name)));
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (extensions.includes(ext)) {
          results.push(path.join(dir, entry.name));
        }
      }
    }

    return results.sort();
  }

  /**
   * Load a single config file.
   */
  private async loadFile(filePath: string): Promise<unknown> {
    const ext = path.extname(filePath);

    try {
      if (ext === '.json') {
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
      }

      // For TS/JS files, use dynamic import
      const module = await import(filePath);
      const exported = module.default ?? module;

      // If it's a function, call it
      if (typeof exported === 'function') {
        return await exported();
      }

      return exported;
    } catch (error: Error | any) {
      throw new ConfigSourceError(`Failed to load config file: ${filePath}`, error as Error);
    }
  }

  /**
   * Extract namespace from a file path relative to the config directory.
   *
   * Handles:
   * - `config/database.config.ts` → `database`
   * - `config/database.ts` → `database`
   * - `config/app/environments.config.ts` → `app.environments`
   * - `config/services/redis.config.ts` → `services.redis`
   *
   * Both `/` directory separators and `.config` suffix are resolved to
   * produce dot-notation namespaces.
   */
  private getNamespace(filePath: string): string {
    const configDir = path.resolve(process.cwd(), this.options.configDir);
    const relative = path.relative(configDir, filePath);

    // Remove extension
    const withoutExt = relative.replace(/\.(ts|js|mjs|json)$/, '');

    // Remove .config suffix if present
    const withoutConfigSuffix = withoutExt.replace(/\.config$/, '');

    // Convert path separators to dots for nested namespaces
    return withoutConfigSuffix.split(path.sep).join('.');
  }

  /**
   * Check if a basename is environment-specific.
   */
  private isEnvSpecific(namespace: string): boolean {
    const envNames = ['development', 'production', 'staging', 'testing', 'local'];
    return envNames.some((env) => namespace.endsWith(`.${env}`));
  }

  /**
   * Set a value in config using a dot-notation namespace.
   * e.g., 'app.environments' sets config.app.environments
   */
  private setNestedByNamespace(namespace: string, value: unknown): void {
    const parts = namespace.split('.');
    if (parts.length === 1) {
      this.config[namespace] = value;
      return;
    }

    let current: Record<string, unknown> = this.config;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i]!;
      if (!(part in current) || typeof current[part] !== 'object' || current[part] === null) {
        current[part] = {};
      }
      current = current[part] as Record<string, unknown>;
    }
    current[parts[parts.length - 1]!] = value;
  }

  /**
   * Get a value from config using a dot-notation namespace.
   */
  private getNestedByNamespace(namespace: string): unknown {
    const parts = namespace.split('.');
    let current: unknown = this.config;

    for (const part of parts) {
      if (current === null || current === undefined || typeof current !== 'object') {
        return undefined;
      }
      current = (current as Record<string, unknown>)[part];
    }

    return current;
  }

  /**
   * Start watching the config directory for changes.
   */
  private startWatching(dir: string): void {
    try {
      this.watcher = fs.watch(dir, { recursive: true }, async (_eventType, filename) => {
        if (!filename) return;
        const ext = path.extname(filename);
        if (!['.ts', '.js', '.mjs', '.json'].includes(ext)) return;

        // Re-load and notify
        const previousConfig = { ...this.config };
        await this.refresh();

        // Detect changed keys
        const changedKeys: string[] = [];
        for (const key of Object.keys(this.config)) {
          if (JSON.stringify(this.config[key]) !== JSON.stringify(previousConfig[key])) {
            changedKeys.push(key);
          }
        }

        if (changedKeys.length > 0 && this.onChangeCallback) {
          this.onChangeCallback(changedKeys);
        }
      });
    } catch {
      // Fail silently if watching is not supported
    }
  }

  /**
   * Deep merge two objects.
   */
  private deepMerge(
    target: Record<string, unknown>,
    source: Record<string, unknown>
  ): Record<string, unknown> {
    const result = { ...target };

    for (const [key, value] of Object.entries(source)) {
      if (
        value !== null &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        typeof result[key] === 'object' &&
        result[key] !== null &&
        !Array.isArray(result[key])
      ) {
        result[key] = this.deepMerge(
          result[key] as Record<string, unknown>,
          value as Record<string, unknown>
        );
      } else {
        result[key] = value;
      }
    }

    return result;
  }
}
