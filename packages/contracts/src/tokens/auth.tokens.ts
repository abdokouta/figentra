/**
 * @file auth.tokens.ts
 * @module @stackra/contracts/tokens
 * @description DI tokens + metadata keys for the authentication subsystem.
 *
 *   The main service tokens (`AUTH_CONFIG`, `AUTH_SERVICE`, etc.) let
 *   any package inject the auth surface without pulling in the
 *   `@stackra/auth` runtime.
 *
 *   The `*_METADATA` symbols are keys used by `@stackra/auth`'s
 *   decorators (`@UseGuards`, `@RequireRole`, `@RequirePermission`) to
 *   stamp guard / role / permission requirements onto route classes.
 *   Consumers (the SSR router, guard invokers, discovery loaders) read
 *   the metadata via `getMetadata(key, target)`.
 */

// ─── Service tokens ──────────────────────────────────────────────────

/** Token for the merged auth module configuration. */
export const AUTH_CONFIG = "auth" as const;

/** Token for the `IAuthService` — login / logout / register / MFA / etc. */
export const AUTH_SERVICE = Symbol.for("AUTH_SERVICE");

/** Token for the `ISessionService` — session lifecycle + device list. */
export const SESSION_SERVICE = Symbol.for("SESSION_SERVICE");

/** Token for the `ISecurityService` — post-auth security checks. */
export const SECURITY_SERVICE = Symbol.for("SECURITY_SERVICE");

/** Token for the `IAccessControlService` — resource/action permission checks. */
export const ACCESS_CONTROL_SERVICE = Symbol.for("ACCESS_CONTROL_SERVICE");

/**
 * Token for the pluggable token-storage adapter — persists the auth
 * token across page loads / app restarts. Implementations wrap
 * `localStorage` (web) or `SecureStore` (native).
 */
export const TOKEN_STORAGE = Symbol.for("TOKEN_STORAGE");

// ─── Route metadata keys ─────────────────────────────────────────────
//
// Each key stamps a metadata slot on a route class via a decorator and
// is later read by the router, guard invoker, or a discovery loader.
// The stamp and the read must resolve to the SAME symbol identity, so
// every key uses `Symbol.for("@stackra/auth:...")` — the global
// registry guarantees a stable identity across module realms.
//
// A plain `Symbol("...")` would produce distinct instance-local
// symbols under dual-instance loading of `@stackra/contracts` (pnpm
// phantom hoists, mixed ESM/CJS graphs, Vite dev-server hot reloads),
// silently splitting the decorator's write from the reader's lookup —
// a `getMetadata(...)` miss that causes guards, roles, and permissions
// to silently no-op. Namespaced keys (`@stackra/auth:...`) protect
// against registry-key collision with any third party.

/** Metadata key holding the array of `Type<ICanActivate>` guards stamped by `@UseGuards(...)`. */
export const GUARDS_METADATA_KEY = Symbol.for("@stackra/auth:guards");

/** Metadata key holding the roles array stamped by `@RequireRole(...)`. */
export const REQUIRED_ROLES_METADATA = Symbol.for(
  "@stackra/auth:required-roles",
);

/** Metadata key holding the `'all' | 'any'` operator paired with the roles list. */
export const ROLE_OPERATOR_METADATA = Symbol.for("@stackra/auth:role-operator");

/** Metadata key holding the resource name for `@RequirePermission({ resource, action })`. */
export const PERMISSION_RESOURCE_METADATA = Symbol.for(
  "@stackra/auth:permission-resource",
);

/** Metadata key holding the action name for `@RequirePermission({ resource, action })`. */
export const PERMISSION_ACTION_METADATA = Symbol.for(
  "@stackra/auth:permission-action",
);

/** Metadata key holding the permissions array for `@RequirePermission({ permissions })`. */
export const PERMISSIONS_METADATA = Symbol.for("@stackra/auth:permissions");

/** Metadata key holding the `'all' | 'any'` operator paired with the permissions list. */
export const PERMISSION_OPERATOR_METADATA = Symbol.for(
  "@stackra/auth:permission-operator",
);
