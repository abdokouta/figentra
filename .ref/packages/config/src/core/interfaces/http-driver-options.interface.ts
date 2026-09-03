/**
 * @file http-driver-options.interface.ts
 * @module @stackra/config/src/interfaces
 * @description IHttpDriverOptions interface.
 */

/**
 * Options for the HTTP config driver.
 */
export interface IHttpDriverOptions {
  /** URL to fetch configuration from. */
  url: string;
  /** Custom HTTP headers for the request. */
  headers?: Record<string, string>;
  /** Query parameters appended to the URL. */
  query?: Record<string, string>;
  /** Polling interval in milliseconds for automatic refresh. Zero or undefined disables. */
  refreshInterval?: number;
  /** Custom fetch implementation (for testing or Node.js compatibility). */
  fetcher?: typeof fetch;
}
