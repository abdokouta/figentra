/**
 * @file discovery-provider.interface.ts
 * @module @stackra/contracts/interfaces/discovery
 * @description Represents one provider entry returned by `IDiscoveryService`.
 *   Carries the resolved instance, the class reference, and any metadata
 *   attached via decorators.
 */

import type { Type } from "../../primitives/type.type";

/**
 * A discovered provider — one entry in the array returned by
 * `IDiscoveryService.getProviders()` or `.getProvidersByMetadata()`.
 */
export interface IDiscoveryProvider {
  /** The provider's class constructor. */
  readonly metatype: Type;

  /** The resolved singleton instance (when available). */
  readonly instance: unknown;

  /** Metadata entries attached to the class via decorators. */
  readonly metadata: ReadonlyMap<string | symbol, unknown>;
}
