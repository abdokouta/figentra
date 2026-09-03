/**
 * @file index.ts
 * @module @stackra/i18n/react
 * @description Web i18n subpath — module, hooks, resolvers, adapters,
 *   components, and zones. For browser environments with DOM access.
 */

// ============================================================================
// Module
// ============================================================================

export { WebI18nModule } from "./web-i18n.module";
export type { WebI18nControl, WebI18nOptions } from "./web-i18n.module";

// ============================================================================
// Hooks
// ============================================================================

export { useI18n, useLocale, useDirection, useFormat } from "./hooks";
export type {
  IFormatDateOptions,
  IFormatNumberOptions,
  IFormatCurrencyOptions,
  IFormatListOptions,
  RelativeTimeUnit,
  IIntlFormatter,
  DateStyle,
  IUseFormatReturn,
  UseI18nReturn,
  UseLocaleReturn,
  UseDirectionReturn,
} from "./hooks";

// ============================================================================
// Resolvers (Web) — options interfaces live in the interfaces block below
// ============================================================================

export {
  LocalStorageResolver,
  NavigatorResolver,
  UrlParamResolver,
  CookieResolver,
  SubdomainResolver,
} from "./resolvers";

// ============================================================================
// Adapters (web-only). Locale storage is unified in `@stackra/i18n/core`
// via `StorageBackedLocaleAdapter` — no separate web adapter shipped.
// ============================================================================

export { WebDirectionAdapter } from "./adapters";

// ============================================================================
// Components (built on @stackra/ui/react)
// ============================================================================

export { LanguageCombobox } from "./components";
export { LanguageSelector } from "./components";
export { LanguageToggle } from "./components";

// ============================================================================
// Interfaces (component props, resolver options, hook return types)
// ============================================================================

export type {
  LanguageComboboxProps,
  LanguageSelectorProps,
  LanguageToggleProps,
  LanguageToggleOption,
  LocaleItem,
  CookieResolverOptions,
  LocalStorageResolverOptions,
  SubdomainResolverOptions,
  UrlParamResolverOptions,
} from "./interfaces";

// ============================================================================
// Non-hook helpers
// ============================================================================

export { __, setDefaultTranslator } from "../core/utils/translate.util";

// ============================================================================
// Zone contributions
// ============================================================================
// Every `.zone.tsx` file exports a `defineZone(...)` result — a
// fully-typed `IZoneContribution` a consuming app registers via
// `ZonesModule.forFeature({ zones: [...] })`. `WebI18nModule`
// pre-registers `languageSelectorHeaderZone` +
// `languageToggleFooterZone` by default; apps that want the
// compact click-toggle in the header swap by wiring
// `languageToggleHeaderZone` from their own module instead, and
// apps that want the fuller `[flag] [name]` dropdown in the
// footer wire `languageSelectorFooterZone`.
export {
  languageComboboxHeaderZone,
  languageSelectorFooterZone,
  languageSelectorHeaderZone,
  languageToggleFooterZone,
  languageToggleHeaderZone,
} from "./zones";

// ============================================================================
// Re-exports from core (convenience)
// ============================================================================

export { I18nModule } from "../core/i18n.module";
export {
  I18nManager,
  I18nLocaleService,
  DirectionService,
} from "../core/services";
