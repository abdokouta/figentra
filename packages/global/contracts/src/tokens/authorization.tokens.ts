/**
 * @file authorization.tokens.ts
 * @module @stackra/contracts/tokens
 * @description DI tokens for the authorization subsystem (`@stackra/authorization`).
 *
 *   The authorization package composes `@stackra/rbac` role / permission
 *   checks with contextual guards (scope, ownership, tenant boundary) via
 *   discoverable policy classes. Tokens live in contracts so cross-package
 *   consumers can inject the authorization service + registry without
 *   pulling in the runtime.
 */

/**
 * Configuration namespace for the authorization subsystem.
 *
 * String constant used both as the `registerAs(AUTHORIZATION_CONFIG, ...)`
 * namespace on the app-side config factory AND as the DI token that
 * `AuthorizationModule` binds the resolved config under. The value IS
 * the namespace string — consumers can spell either the constant or the
 * literal `"authorization"` and reach the same registration.
 */
export const AUTHORIZATION_CONFIG = "authorization" as const;
