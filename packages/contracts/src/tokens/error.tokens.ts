/**
 * @file error.tokens.ts
 * @module @stackra/contracts/tokens
 * @description DI tokens for the error subsystem (`@stackra/error`).
 *
 *   The error package owns fault classification, retry policies, and
 *   error-boundary integration. Tokens live in contracts so cross-package
 *   consumers can inject the error registry / reporter without pulling
 *   in the runtime.
 */

/**
 * Configuration namespace for the error subsystem.
 *
 * String constant used both as the `registerAs(ERROR_CONFIG, ...)`
 * namespace on the app-side config factory AND as the DI token that
 * `ErrorModule` binds the resolved config under. The value IS the
 * namespace string — consumers can spell either the constant or the
 * literal `"error"` and reach the same registration.
 */
export const ERROR_CONFIG = "error" as const;
