/**
 * @file i18n.tokens.ts
 * @module @stackra/contracts/tokens
 * @description DI tokens for the internationalization subsystem.
 *
 *   These tokens live in contracts (not `@stackra/i18n`) so cross-package
 *   consumers — `@stackra/http` locale-header middleware, `@stackra/ai`
 *   translation providers, `@stackra/analytics` locale tagging, UI
 *   packages, custom SSR renderers — can inject them without pulling in
 *   the `@stackra/i18n` runtime. Mirrors CACHE_MANAGER, EVENT_EMITTER,
 *   NETWORK_SERVICE, STATE_REGISTRY.
 */

/**
 * Configuration namespace for the i18n subsystem.
 *
 * String constant used both as the `registerAs(I18N_CONFIG, ...)`
 * namespace on the app-side config factory AND as the DI token that
 * `I18nModule` binds the resolved config under. The value IS the
 * namespace string — consumers can spell either the constant or the
 * literal `"i18n"` and reach the same registration.
 */
export const I18N_CONFIG = "i18n" as const;

/** Token for the `II18nManager` — translation engine. */
export const I18N_MANAGER = Symbol.for("I18N_MANAGER");

/** Token for the `II18nLocaleService` — reactive locale orchestrator. */
export const I18N_LOCALE_SERVICE = Symbol.for("I18N_LOCALE_SERVICE");

/** Token for the `IDirectionService` — RTL/LTR detection + platform delegation. */
export const I18N_DIRECTION_SERVICE = Symbol.for("I18N_DIRECTION_SERVICE");

/**
 * Token for the platform-specific `IDirectionAdapter` (web / native / SSR).
 * Optional — when unbound, `DirectionService` falls back to a no-op adapter.
 */
export const I18N_DIRECTION_ADAPTER = Symbol.for("I18N_DIRECTION_ADAPTER");

/**
 * Token for the platform-specific `ILocaleStorage` (localStorage /
 * AsyncStorage / …). Optional — when unbound, no persistence is performed.
 */
export const I18N_LOCALE_STORAGE = Symbol.for("I18N_LOCALE_STORAGE");

/**
 * Token for an optional `ITranslationProvider` — used by external packages
 * (`@stackra/ai`, machine-translation services) to auto-translate missing
 * keys.
 */
export const I18N_TRANSLATION_PROVIDER = Symbol.for(
  "I18N_TRANSLATION_PROVIDER",
);
