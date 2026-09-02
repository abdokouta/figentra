/**
 * @file consent.tokens.ts
 * @module @stackra/contracts/tokens
 * @description DI tokens for the consent management system.
 */

/**
 * Configuration namespace for the consent subsystem.
 *
 * String constant used both as the `registerAs(CONSENT_CONFIG, ...)`
 * namespace on the app-side config factory AND as the DI token that
 * `ConsentModule` binds the resolved config under. The value IS the
 * namespace string — consumers can spell either the constant or the
 * literal `"consent"` and reach the same registration.
 */
export const CONSENT_CONFIG = "consent" as const;

/** Injection token for the {@link IConsentManager} service. */
export const CONSENT_MANAGER = Symbol.for("CONSENT_MANAGER");

/** Injection token for the {@link IConsentStorageAdapter}. */
export const CONSENT_STORAGE_ADAPTER = Symbol.for("CONSENT_STORAGE_ADAPTER");
