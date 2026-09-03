/**
 * @file doppler-secrets-driver-options.interface.ts
 * @module @stackra/config/src/interfaces
 * @description IDopplerSecretsDriverOptions interface.
 */

/**
 * Configuration options for the Doppler secrets driver.
 */
export interface IDopplerSecretsDriverOptions {
  /** Doppler service token for authentication. */
  token: string;
  /** Doppler project name. */
  project: string;
  /** Doppler config environment (e.g., 'production', 'staging'). */
  config: string;
  /** Doppler API endpoint (defaults to 'https://api.doppler.com'). */
  endpoint?: string;
  /** Auto-refresh interval in milliseconds (0 to disable). */
  refreshIntervalMs?: number;
}
