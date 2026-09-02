/**
 * @file access-requests.tokens.ts
 * @module @stackra/contracts/tokens
 * @description DI tokens for the `@stackra/access-requests` runtime —
 *   user-initiated permission requests + admin approval workflows.
 *
 *   Every token uses `Symbol.for(...)` so the same identity is
 *   observed across module realms.
 */

/** DI token for the merged `IAccessRequestsConfig`. */
export const ACCESS_REQUESTS_CONFIG = "access-requests" as const;

/** DI token for the `AccessRequestsService` — request lifecycle. */
export const ACCESS_REQUESTS_SERVICE = Symbol.for("ACCESS_REQUESTS_SERVICE");
