/**
 * @file discovery-service.token.ts
 * @module @stackra/contracts/tokens
 * @description DI token for the discovery service.
 *   Binds `IDiscoveryService` — scans the DI graph for metadata-decorated
 *   providers (per `discovery-vs-loader.md`).
 */

/** Injection token for `IDiscoveryService`. */
export const DISCOVERY_SERVICE: unique symbol = Symbol.for("DISCOVERY_SERVICE");
