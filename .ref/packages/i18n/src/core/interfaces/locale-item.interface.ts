/**
 * @file locale-item.interface.ts
 * @module @stackra/i18n/core/interfaces
 * @description Locale display metadata — one entry per supported
 *   locale.
 *
 *   Consumed by:
 *
 *   - `II18nConfig.locales` — the app-supplied display map (name +
 *     flag per locale).
 *   - `I18nLocaleService.getLocales()` — the runtime accessor
 *     served through DI to hooks + components.
 *   - `useI18n().locales` — the hook return field every locale
 *     picker reads (`LanguageSelector`, `LanguageToggle`, custom
 *     zone adapters).
 *   - `NativeLanguageSelector` — the RN sibling reads the same
 *     shape.
 *
 *   Kept in `core/` so BOTH `react/` and `native/` subpaths + the
 *   platform-agnostic `II18nConfig` reference the same canonical
 *   type — mirrors the `subpath-layering.md` §"Where does a hook
 *   / context / provider go?" rule for cross-platform entities.
 */

/**
 * Display metadata for one locale — the shape every locale
 * picker renders from.
 */
export interface LocaleItem {
  /** BCP-47 locale code (e.g. `"en"`, `"ar"`, `"fr-CA"`). */
  readonly code: string;

  /**
   * Human-readable label shown next to the flag in the picker.
   * Typically the language's endonym (`"English"`, `"العربية"`,
   * `"Français"`).
   */
  readonly name: string;

  /**
   * Optional flag emoji or icon. Region-flag emojis
   * (`"🇺🇸"`, `"🇸🇦"`) are common; language-specific glyphs work
   * equally well. Omit to render text-only.
   */
  readonly flag?: string;
}
