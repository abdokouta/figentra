/**
 * @file auth-ui.tokens.ts
 * @module @stackra/contracts/tokens
 * @description DI tokens for the `@stackra/auth-ui` runtime — the
 *   authentication surface presenter (login / register / MFA / SSO
 *   variants + lock-mode).
 *
 *   Every token uses `Symbol.for(...)` so the same identity is
 *   observed across module realms.
 */

/** DI token for the merged `IAuthUiConfig` (variants + branding). */
export const AUTH_UI_CONFIG = "auth-ui" as const;
