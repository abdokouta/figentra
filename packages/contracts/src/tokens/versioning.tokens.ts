/**
 * @file versioning.tokens.ts
 * @module @stackra/contracts/tokens
 * @description DI tokens for the API-versioning subsystem.
 *
 *   Mirrors the backend `stackra/versioning` wrapper — the two sides
 *   speak the same header names + strategies + event vocabulary.
 */

/**
 * Configuration namespace for the versioning subsystem.
 *
 * String constant used both as the `registerAs(VERSIONING_CONFIG, ...)`
 * namespace on the app-side config factory AND as the DI token that
 * `VersioningModule` binds the resolved config under. The value IS the
 * namespace string — consumers can spell either the constant or the
 * literal `"versioning"` and reach the same registration.
 */
export const VERSIONING_CONFIG = "versioning" as const;

/**
 * Token for the versioning service — reads the default version per
 * connection, records deprecated hits, exposes the deprecation tracker
 * to React consumers via `useApiVersion()`.
 */
export const VERSIONING_SERVICE = Symbol.for("VERSIONING_SERVICE");

/**
 */
export const DEPRECATION_TRACKER = Symbol.for("DEPRECATION_TRACKER");
