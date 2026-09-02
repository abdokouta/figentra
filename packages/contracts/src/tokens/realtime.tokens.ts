/**
 * @file realtime.tokens.ts
 * @module @stackra/contracts/tokens
 * @description DI tokens for the realtime WebSocket subsystem.
 *
 *   These tokens live in contracts (not `@stackra/realtime`) so
 *   cross-package consumers can inject the realtime manager without
 *   pulling in the runtime — same pattern as CACHE_MANAGER, EVENT_EMITTER.
 */

/** Token for the RealtimeManager singleton. */
export const REALTIME_MANAGER = Symbol.for("REALTIME_MANAGER");

/**
 * Configuration namespace for the realtime subsystem.
 *
 * String constant used both as the `registerAs(REALTIME_CONFIG, ...)`
 * namespace on the app-side config factory AND as the DI token that
 * `RealtimeModule` binds the resolved config under. The value IS the
 * namespace string — consumers can spell either the constant or the
 * literal `"realtime"` and reach the same registration.
 */
export const REALTIME_CONFIG = "realtime" as const;
