/**
 * @file network.tokens.ts
 * @module @stackra/contracts/tokens
 * @description DI tokens for the network subsystem.
 *
 *   Tokens live in contracts so cross-package consumers (sync, http retry,
 *   offline queues) can inject network detection without pulling in the
 *   `@stackra/network` runtime.
 */

/**
 * Configuration namespace for the network subsystem.
 *
 * String constant used both as the `registerAs(NETWORK_CONFIG, ...)`
 * namespace on the app-side config factory AND as the DI token that
 * `NetworkModule` binds the resolved config under. The value IS the
 * namespace string — consumers can spell either the constant or the
 * literal `"network"` and reach the same registration.
 */
export const NETWORK_CONFIG = "network" as const;

/** Token for the platform-specific `INetworkDetector` implementation. */
export const NETWORK_DETECTOR = Symbol.for("NETWORK_DETECTOR");

/** Token for the high-level `NetworkService` (detector + event emission). */
export const NETWORK_SERVICE = Symbol.for("NETWORK_SERVICE");
