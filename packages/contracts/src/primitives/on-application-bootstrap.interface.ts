/**
 * @file on-application-bootstrap.interface.ts
 * @module @stackra/contracts/primitives
 * @description Lifecycle hook invoked after EVERY module has finished
 *   `onModuleInit`. Use for cross-module coordination — discovery scans,
 *   feature registrars, event-subscriber wiring.
 *
 *   Fires AFTER `OnModuleInit`. See `module-lifecycle.md`.
 */

/**
 * Implement on any `@Injectable()` class that needs to scan or coordinate
 * across modules after the full graph is initialised.
 *
 * @example
 * ```ts
 * import type { OnApplicationBootstrap } from "@stackra/contracts";
 *
 * @Injectable()
 * class RouteDiscovery implements OnApplicationBootstrap {
 *   onApplicationBootstrap(): void {
 *     // discovery.getProvidersByMetadata(...)
 *   }
 * }
 * ```
 */
export interface OnApplicationBootstrap {
  /** Called after every module's `onModuleInit` has completed. */
  onApplicationBootstrap(): void | Promise<void>;
}
