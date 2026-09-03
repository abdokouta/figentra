/**
 * @file doppler-secrets.driver.ts
 * @module @stackra/config/nestjs/drivers
 * @description Doppler Secrets driver for the config system.
 *   Fetches secrets from the Doppler API and exposes them as config values.
 *   Supports automatic refresh on TTL expiry for seamless secret rotation.
 */

import type { IConfigDriver } from '@stackra/contracts';

// ============================================================================
// Interfaces
// ============================================================================

// ============================================================================
// Driver
// ============================================================================

/**
 * Doppler Secrets config driver.
 *
 * Fetches secrets from the Doppler API and exposes them as config values.
 * This is a read-only driver: `set()` and `delete()` are no-ops since
 * secrets are managed through Doppler's dashboard/CLI.
 *
 * Supports automatic refresh on a configurable interval for seamless
 * secret rotation without application restarts.
 *
 * Fail-open pattern: if the Doppler API is unreachable, the driver retains
 * the last successfully fetched secrets and logs a warning.
 *
 * @example
 * ```typescript
 * import { DopplerSecretsDriver } from '@stackra/config/nestjs';
 *
 * const driver = new DopplerSecretsDriver({
 *   token: process.env.DOPPLER_TOKEN!,
 *   project: 'my-app',
 *   config: 'production',
 *   refreshIntervalMs: 60_000, // Refresh every minute
 * });
 *
 * await driver.load();
 * const dbUrl = driver.get('DATABASE_URL');
 * ```
 */
export class DopplerSecretsDriver implements IConfigDriver {
  private secrets: Record<string, string> = {};
  private readonly token: string;
  private readonly project: string;
  private readonly config: string;
  private readonly endpoint: string;
  private readonly refreshIntervalMs: number;
  private refreshTimer?: ReturnType<typeof setInterval>;

  /**
   * @param options - Doppler driver configuration
   */
  public constructor(options: IDopplerSecretsDriverOptions) {
    this.token = options.token;
    this.project = options.project;
    this.config = options.config;
    this.endpoint = options.endpoint ?? 'https://api.doppler.com';
    this.refreshIntervalMs = options.refreshIntervalMs ?? 0;
  }

  /**
   * Fetch secrets from the Doppler API.
   *
   * Makes an authenticated request to the Doppler download endpoint
   * and populates the internal secrets map. Starts the auto-refresh
   * timer if configured.
   *
   * @throws Error if the initial load fails and no cached secrets exist
   */
  public async load(): Promise<void> {
    await this.fetchSecrets();

    // Start auto-refresh if configured
    if (this.refreshIntervalMs > 0) {
      this.startRefreshTimer();
    }
  }

  /**
   * Get a secret value by key.
   *
   * @param key - The secret key name
   * @param defaultValue - Default value if key is not found
   * @returns The secret value, or the default
   */
  public get<T = unknown>(key: string, defaultValue?: T): T | undefined {
    const value = this.secrets[key];
    if (value === undefined) return defaultValue;
    return value as unknown as T;
  }

  /**
   * Check if a secret exists.
   *
   * @param key - The secret key name
   * @returns Whether the key exists in the loaded secrets
   */
  public has(key: string): boolean {
    return key in this.secrets;
  }

  /**
   * No-op — Doppler secrets are read-only from the application side.
   * Use Doppler's dashboard or CLI to manage secrets.
   *
   * @param _key - Ignored
   * @param _value - Ignored
   */
  public set(_key: string, _value: unknown): void {
    // No-op: Doppler is the source of truth for secrets
  }

  /**
   * No-op — Doppler secrets cannot be deleted from the application.
   * Use Doppler's dashboard or CLI to manage secrets.
   *
   * @param _key - Ignored
   */
  public delete(_key: string): void {
    // No-op: Doppler is the source of truth for secrets
  }

  /**
   * Get all loaded secrets as a record.
   *
   * @returns A copy of all secret key-value pairs
   */
  public all(): Record<string, unknown> {
    return { ...this.secrets };
  }

  /**
   * Force a refresh of secrets from Doppler.
   * Called automatically on the configured interval and by the
   * ConfigHotReloadService on pub/sub notifications.
   */
  public async refresh(): Promise<void> {
    await this.fetchSecrets();
  }

  /**
   * Clean up the refresh timer on disposal.
   */
  public dispose(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = undefined;
    }
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Private
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Fetch secrets from the Doppler download API.
   */
  private async fetchSecrets(): Promise<void> {
    const url = `${this.endpoint}/v3/configs/config/secrets/download`;
    const params = new URLSearchParams({
      project: this.project,
      config: this.config,
      format: 'json',
    });

    try {
      const response = await fetch(`${url}?${params.toString()}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.token}`,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Doppler API returned ${response.status}: ${response.statusText}`);
      }

      const data = (await response.json()) as Record<string, string>;
      this.secrets = data;
    } catch (error: Error | any) {
      // Fail-open: if we have cached secrets, keep using them
      if (Object.keys(this.secrets).length > 0) {
        // Using cached secrets — Doppler API unreachable
      } else {
        // No cached secrets — re-throw on initial load
        throw error;
      }
    }
  }

  /**
   * Start the auto-refresh timer.
   */
  private startRefreshTimer(): void {
    this.refreshTimer = setInterval(() => {
      this.fetchSecrets().catch(() => {
        // Fail-open: auto-refresh failure is non-fatal
      });
    }, this.refreshIntervalMs);
  }
}
