/**
 * @file coordinator.tokens.ts
 * @module @stackra/contracts/tokens
 * @description DI tokens for the cross-tab coordinator system.
 *
 *   These tokens live in contracts (not `@stackra/coordinator`) so
 *   consumers can inject the coordinator services without pulling in
 *   the runtime package — pattern matches CACHE_MANAGER, EVENT_EMITTER,
 *   LOGGER_MANAGER.
 */

/**
 * Configuration namespace for the cross-tab coordinator subsystem.
 *
 * String constant used both as the `registerAs(COORDINATOR_CONFIG, ...)`
 * namespace on the app-side config factory AND as the DI token that
 * `CoordinatorModule` binds the resolved config under. The value IS
 * the namespace string — consumers can spell either the constant or
 * the literal `"coordinator"` and reach the same registration.
 */
export const COORDINATOR_CONFIG = "coordinator" as const;

/** Token for the TabCoordinator instance (leader election, tab census). */
export const TAB_COORDINATOR = Symbol.for("TAB_COORDINATOR");

/** Token for the cross-tab LockManager (distributed locks). */
export const TAB_LOCK_MANAGER = Symbol.for("TAB_LOCK_MANAGER");

/**
 * Token for the cross-tab transport manager
 * ({@link ITabTransportManager}). Exposes named
 * `BroadcastChannel`-style channels to any package that needs to
 * broadcast between tabs.
 */
export const TAB_TRANSPORT_MANAGER = Symbol.for("TAB_TRANSPORT_MANAGER");
