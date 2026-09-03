/**
 * @file http.driver.ts
 * @module @stackra/config/core/services
 * @description HTTP config driver that fetches JSON from a remote endpoint.
 *   Supports periodic refresh, custom headers, and query parameters.
 */

import type { IConfigDriver } from '@stackra/contracts';
import { getNestedValue, hasNestedValue } from '../utils';
import { ConfigSourceError } from '../errors';

// ════════════════════════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════════════
// Driver
// ════════════════════════════════════════════════════════════════════════════════

/**
 * HTTP config driver.
 *
 * Fetches JSON configuration from a remote endpoint. Supports periodic
 * auto-refresh for dynamic config (feature flags, remote toggles).
 *
 * @example
 * ```typescript
 * const driver = new HttpDriver({
 *   url: 'https://api.example.com/config',
 *   headers: { 'Authorization': 'Bearer token' },
 *   refreshInterval: 60_000, // refresh every minute
 * });
 * await driver.load();
 * const feature = driver.get('features.darkMode');
 * ```
 */
export class HttpDriver implements IConfigDriver {
  /** Internal configuration store. */
  private config: Record<string, unknown> = {};

  /** Timer reference for auto-refresh. */
  private refreshTimer: ReturnType<typeof setInterval> | null = null;

  /** Whether the driver has completed initial load. */
  private loaded = false;

  /** Timestamp of last successful fetch. */
  private lastFetchedAt: Date | null = null;

  /** The fetch function to use (allows injection for testing). */
  private readonly fetcher: typeof fetch;

  /**
   * @param options - HTTP driver configuration
   */
  public constructor(private readonly options: IHttpDriverOptions) {
    this.fetcher = options.fetcher ?? globalThis.fetch?.bind(globalThis);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Load & Refresh
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Fetch configuration from the remote endpoint.
   *
   * Sets up auto-refresh if `refreshInterval` is configured.
   * Throws ConfigSourceError on HTTP failure.
   */
  public async load(): Promise<void> {
    await this.fetchConfig();
    this.loaded = true;

    if (this.options.refreshInterval && this.options.refreshInterval > 0) {
      this.startAutoRefresh();
    }
  }

  /**
   * Force re-fetch configuration from the remote endpoint.
   * Returns the set of keys that changed.
   */
  public async refresh(): Promise<void> {
    await this.fetchConfig();
  }

  /**
   * Dispose resources (clear the auto-refresh timer).
   */
  public dispose(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // IConfigDriver (read operations)
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Get a value by dot-notation key.
   *
   * @typeParam T - Expected return type
   * @param key - Configuration key (supports dot notation)
   * @param defaultValue - Fallback value
   * @returns The value or default
   */
  public get<T = unknown>(key: string, defaultValue?: T): T | undefined {
    return getNestedValue<T>(this.config, key, defaultValue);
  }

  /**
   * Check if a key exists.
   *
   * @param key - Configuration key (supports dot notation)
   * @returns True if the key exists
   */
  public has(key: string): boolean {
    return hasNestedValue(this.config, key);
  }

  /**
   * Get all configuration values.
   *
   * @returns A shallow copy of the fetched config
   */
  public all(): Record<string, unknown> {
    return { ...this.config };
  }

  /**
   * Set a value in the local cache (does NOT persist to remote).
   *
   * @param key - Configuration key
   * @param value - Value to set
   */
  public set(key: string, value: unknown): void {
    this.config[key] = value;
  }

  /**
   * Merge additional values into the local cache.
   *
   * @param config - Values to deep-merge
   */
  public merge(config: Record<string, unknown>): void {
    this.config = this.deepMerge(this.config, config);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Introspection
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Get the timestamp of the last successful fetch.
   *
   * @returns Date of last fetch or null if never fetched
   */
  public getLastFetchedAt(): Date | null {
    return this.lastFetchedAt;
  }

  /**
   * Check if the driver has completed initial load.
   *
   * @returns True if loaded
   */
  public isLoaded(): boolean {
    return this.loaded;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Private Helpers
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Execute the HTTP fetch and parse the JSON response.
   */
  private async fetchConfig(): Promise<void> {
    if (!this.fetcher) {
      throw new ConfigSourceError(
        'HTTP config driver requires a fetch implementation. ' +
          'Ensure globalThis.fetch is available or provide a custom fetcher.'
      );
    }

    const url = this.buildUrl();

    try {
      const response = await this.fetcher(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          ...this.options.headers,
        },
      });

      if (!response.ok) {
        throw new ConfigSourceError(
          `HTTP config fetch failed: ${response.status} ${response.statusText} from ${url}`
        );
      }

      const data = await response.json();

      if (typeof data !== 'object' || data === null || Array.isArray(data)) {
        throw new ConfigSourceError(
          `HTTP config response must be a JSON object, got ${typeof data} from ${url}`
        );
      }

      this.config = data as Record<string, unknown>;
      this.lastFetchedAt = new Date();
    } catch (error: Error | any) {
      if (error instanceof ConfigSourceError) {
        throw error;
      }
      throw new ConfigSourceError(
        `HTTP config fetch failed for ${url}: ${(error as Error).message}`
      );
    }
  }

  /**
   * Build the full URL with query parameters.
   */
  private buildUrl(): string {
    const base = this.options.url;
    const query = this.options.query;

    if (!query || Object.keys(query).length === 0) {
      return base;
    }

    const params = new URLSearchParams(query);
    const separator = base.includes('?') ? '&' : '?';
    return `${base}${separator}${params.toString()}`;
  }

  /**
   * Start the auto-refresh timer.
   */
  private startAutoRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }

    this.refreshTimer = setInterval(async () => {
      try {
        await this.fetchConfig();
      } catch {
        // Fail silently on refresh — keep previous values
      }
    }, this.options.refreshInterval);
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
