/**
 * @file grants.tokens.ts
 * @module @stackra/contracts/tokens
 * @description DI tokens for the `@stackra/grants` scoped-permission
 *   grants runtime — issuing and revoking user-level grants.
 *
 *   Every token uses `Symbol.for(...)` so the same identity is
 *   observed across module realms.
 */

/** DI token for the merged `IGrantsConfig`. */
export const GRANTS_CONFIG = "grants" as const;

/** DI token for the `GrantsService` — CRUD over user grants. */
export const GRANTS_SERVICE = Symbol.for("GRANTS_SERVICE");
