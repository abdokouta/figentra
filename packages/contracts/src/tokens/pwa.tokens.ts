/**
 * @file pwa.tokens.ts
 * @module @stackra/contracts/tokens
 * @description DI tokens for cross-package PWA concerns.
 *
 *   `@stackra/pwa` owns the runtime; this file just exposes the
 *   canonical injection keys so other packages (settings, sdui, admin
 *   dashboards) can talk to the app-version state without importing
 *   the PWA runtime.
 */

/**
 * Configuration namespace for the PWA subsystem (top-level).
 *
 * String constant used both as the `registerAs(PWA_CONFIG, ...)`
 * namespace on the app-side config factory AND as the DI token that
 * `PwaModule` binds the resolved config under. The value IS the
 * namespace string — consumers can spell either the constant or the
 * literal `"pwa"` and reach the same registration.
 *
 * Distinct from {@link APP_VERSION_CONFIG} (`"pwa.app-version"`), which
 * is the sub-scope for the app-version state slice.
 */
export const PWA_CONFIG = "pwa" as const;

/**
 * Token for the `IAppVersionService` — canonical source of truth for
 * server-declared app version state (current version, minimum
 * supported version, per-platform update URLs, mandatory flag,
 * release notes URL).
 *
 * @remarks Bound in `@stackra/pwa`'s `AppVersionModule.forRoot`.
 */
export const APP_VERSION_SERVICE = Symbol.for("APP_VERSION_SERVICE");

/**
 * Token for the resolved `IAppVersionConfig`. Consumed by the app
 * version service to know which HTTP client / endpoint to poll and
 * which realtime channel to listen on.
 *
 * @remarks Bound in `@stackra/pwa`'s `AppVersionModule.forRoot`.
 */
export const APP_VERSION_CONFIG = "pwa.app-version" as const;
