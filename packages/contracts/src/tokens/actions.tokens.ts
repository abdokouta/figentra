/**
 * @file actions.tokens.ts
 * @module @stackra/contracts/tokens
 * @description DI tokens for the framework Action layer.
 *
 *   The Action layer routes every side effect (navigate, toast, mutate,
 *   set-state, upload, ...) through one dispatcher + registry, so
 *   authorization, logging, tracing and cancellation land in a single
 *   pipeline.
 */

/**
 * Configuration namespace for the Action layer.
 *
 * String constant used both as the `registerAs(ACTIONS_CONFIG, ...)`
 * namespace on the app-side config factory AND as the DI token that
 * `ActionsModule` binds the resolved config under. The value IS the
 * namespace string — consumers can spell either the constant or the
 * literal `"actions"` and reach the same registration.
 */
export const ACTIONS_CONFIG = "actions" as const;

/** Token for the `ActionRegistry` — the name-keyed map of registered handlers. */
export const ACTION_REGISTRY = Symbol.for("ACTION_REGISTRY");

/** Token for the `IActionDispatcher` — the single entry point for every action. */
export const ACTION_DISPATCHER = Symbol.for("ACTION_DISPATCHER");

/**
 * Reflect-metadata key stamped by `@ActionHandler(kind)` on class-shaped
 * handlers so `HandlerDiscoveryService.onApplicationBootstrap` can pick
 * them up.
 */
export const ACTION_HANDLER_METADATA = Symbol.for("ACTION_HANDLER_METADATA");

/**
 * Token for the consumer-supplied `IPermissionResolver` used by the
 * `AuthorizeMiddleware` to gate descriptors carrying a `permission` field.
 */
export const PERMISSION_RESOLVER = Symbol.for("PERMISSION_RESOLVER");
