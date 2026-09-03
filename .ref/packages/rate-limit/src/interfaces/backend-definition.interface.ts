/**
 * @file backend-definition.interface.ts
 * @module @stackra/rate-limit/src/interfaces
 * @description IBackendDefinition interface.
 */

/**
 * Custom backend definition for `forFeature()`.
 */
export interface IBackendDefinition {
  /** Backend driver name (used in config.backend or manager.driver('name')). */
  readonly name: string;
  /** Factory function that creates the backend instance. */
  readonly creator: ManagerDriverCreator<IRateLimiterBackend, RateLimiterManager>;
}
