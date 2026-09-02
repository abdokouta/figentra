/**
 * @file rbac.tokens.ts
 * @module @stackra/contracts/tokens
 * @description DI tokens for the `@stackra/rbac` role-based access
 *   control runtime — permissions + roles surface for admin UIs.
 *
 *   Every token uses `Symbol.for(...)` so the same identity is
 *   observed across module realms.
 */

/** DI token for the merged `IRbacConfig`. */
export const RBAC_CONFIG = "rbac" as const;

/** DI token for the `PermissionsService` — CRUD over permission catalog. */
export const PERMISSIONS_SERVICE = Symbol.for("PERMISSIONS_SERVICE");

/** DI token for the `RolesService` — CRUD over role catalog + assignments. */
export const ROLES_SERVICE = Symbol.for("ROLES_SERVICE");
