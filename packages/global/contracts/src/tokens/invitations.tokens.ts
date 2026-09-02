/**
 * @file invitations.tokens.ts
 * @module @stackra/contracts/tokens
 * @description DI tokens for the `@stackra/invitations` runtime —
 *   sending, accepting, and revoking user invitations.
 *
 *   Every token uses `Symbol.for(...)` so the same identity is
 *   observed across module realms.
 */

/** DI token for the merged `IInvitationsConfig`. */
export const INVITATIONS_CONFIG = "invitations" as const;

/** DI token for the `InvitationsService` — invitation lifecycle. */
export const INVITATIONS_SERVICE = Symbol.for("INVITATIONS_SERVICE");
