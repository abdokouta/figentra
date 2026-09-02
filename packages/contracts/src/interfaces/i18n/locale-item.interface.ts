/**
 * @file locale-item.interface.ts
 * @module @stackra/contracts/interfaces/i18n
 * @description Cross-package locale-display shape — one entry per
 *   supported locale.
 *
 *   Lives in contracts because `II18nLocaleService.getLocales()`
 *   returns it, and cross-package consumers (`@stackra/http`
 *   locale-header middleware, `@stackra/monitoring` locale-scoped
 *   errors, custom app-side pickers, …) may inspect the display
 *   metadata without pulling `@stackra/i18n` as a hard dep.
 */

/**
 * Display metadata for one locale — the shape every locale
 * picker renders from.
 */
export interface ILocaleItem {
  /** BCP-47 locale code (e.g. `"en"`, `"ar"`, `"fr-CA"`). */
  readonly code: string;

  /**
   * Human-readable label rendered next to the flag. Typically the
   * endonym (`"English"`, `"العربية"`, `"Français"`).
   */
  readonly name: string;

  /**
   * Optional flag emoji or icon (region-flag emojis like `"🇺🇸"`
   * are common; language-specific glyphs work too). Omit to
   * render text-only.
   */
  readonly flag?: string;
}
