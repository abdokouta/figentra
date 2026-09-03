/**
 * @file discovery-adapter.interface.ts
 * @module @stackra/logger/core/interfaces
 * @description Internal interface for provider discovery.
 *   Abstracts the platform-specific mechanism for discovering DI providers
 *   so the ReporterLoader can scan for @Reporter-decorated classes.
 *   This is NOT a cross-package contract — it is used only within the logger package.
 */

/**
 * Wrapper around a discovered provider instance.
 * Contains the live instance and its constructor (metatype) for metadata inspection.
 */
export interface IDiscoveredProvider {
  /** The resolved provider instance. */
  instance: any;

  /** The constructor function (class) of the provider, or null if not class-based. */
  metatype: Function | null;
}

/**
 * Abstracts platform-specific provider discovery.
 *
 * The core module uses a simple adapter that receives reporter instances directly.
 * The NestJS module uses the NestJS DiscoveryService to scan all providers at runtime.
 *
 * This interface is internal to the logger package — it is NOT exported to consumers
 * and does NOT live in `@stackra/contracts`.
 */
export interface IDiscoveryAdapter {
  /**
   * Return all providers that should be inspected for @Reporter metadata.
   *
   * @returns Array of discovered providers with their instances and metatypes
   */
  getProviders(): IDiscoveredProvider[];
}
