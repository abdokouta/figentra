/**
 * @file delegation.tokens.ts
 * @module @stackra/contracts/tokens
 * @description DI tokens for the `@stackra/delegation` runtime —
 *   role delegation between users + admin impersonation sessions.
 *
 *   Every token uses `Symbol.for(...)` so the same identity is
 *   observed across module realms.
 */

/** DI token for the merged `IDelegationConfig`. */
export const DELEGATION_CONFIG = "delegation" as const;

/** DI token for the `DelegationService` — role delegation lifecycle. */
export const DELEGATION_SERVICE = Symbol.for("DELEGATION_SERVICE");

/** DI token for the `ImpersonationService` — admin impersonation sessions. */
export const IMPERSONATION_SERVICE = Symbol.for("IMPERSONATION_SERVICE");
