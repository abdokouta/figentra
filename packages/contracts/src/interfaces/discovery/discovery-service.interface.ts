/**
 * @file discovery-service.interface.ts
 * @module @stackra/contracts/interfaces/discovery
 * @description Contract for the DI discovery service. Scans the container
 *   graph for providers carrying a given metadata key. Framework-layer
 *   primitive; loaders (per `discovery-vs-loader.md`) compose against this.
 */

import type { IDiscoveryProvider } from "./discovery-provider.interface";

/**
 * Discovery service contract — injected via `DISCOVERY_SERVICE` token.
 * The container's implementation scans the full provider graph; consumers
 * never need to walk modules themselves.
 */
export interface IDiscoveryService {
  /**
   * Returns every provider registered in the container.
   *
   * @returns All registered providers.
   */
  getProviders(): IDiscoveryProvider[];

  /**
   * Returns every provider decorated with the specified metadata key.
   *
   * @param key - The metadata key to filter by (e.g. `ROUTE_METADATA_KEY`).
   * @returns Providers that carry the given metadata.
   */
  getProvidersByMetadata(key: symbol | string): IDiscoveryProvider[];
}
