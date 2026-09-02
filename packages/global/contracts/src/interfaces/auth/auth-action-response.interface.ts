/**
 * @file auth-action-response.interface.ts
 * @module @stackra/contracts/interfaces/auth
 * @description Standard response shape returned by every mutating
 *   `IAuthService` operation (login, logout, register, verify, etc.).
 */

/**
 * Standard response shape for auth mutation methods.
 *
 * Two navigation-adjacent fields exist and serve DIFFERENT purposes:
 *
 * - `redirectTo` — a CLIENT-SIDE ROUTE (e.g. `/dashboard`,
 *   `/auth/mfa`). Consumers hand this to their router's
 *   `navigate()` primitive. Same-origin, SPA-scoped.
 * - `redirectUrl` — an EXTERNAL URL (e.g. an OAuth authorisation URL
 *   at `https://accounts.google.com/o/oauth2/...`). Consumers hand
 *   this to `window.location.assign()` — a full-page navigation
 *   OUT of the SPA to a third-party origin. Codified by ADR-0093.
 *
 * Both are optional and independent — an action may return neither,
 * one, or both. When both are present, the consumer's contract is:
 * external navigation wins (OAuth start flows can't complete
 * client-side; the `redirectUrl` MUST be honoured).
 */
export interface IAuthActionResponse {
  /** Whether the operation completed successfully. */
  success: boolean;
  /**
   * Client-side route the caller should navigate to on success /
   * failure. Handed to the SPA router (e.g. React Router's
   * `useNavigate()`). Same-origin. Example: `"/dashboard"`.
   */
  redirectTo?: string;
  /**
   * External URL the caller should navigate the whole browser to.
   * Handed to `window.location.assign()`. Cross-origin. Used by
   * OAuth start flows to send the user to the provider's consent
   * screen. Codified by ADR-0093.
   *
   * @example
   * ```typescript
   * const response = await auth.startSocial("google");
   * if (response.redirectUrl) {
   *   window.location.assign(response.redirectUrl);
   *   return;
   * }
   * ```
   */
  redirectUrl?: string;
  /** The error that caused a failure. Absent on success. */
  error?: Error;
}
