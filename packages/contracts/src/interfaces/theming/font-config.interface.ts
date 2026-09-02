/**
 * @file font-config.interface.ts
 * @module @stackra/contracts/interfaces/theming
 * @description Metadata for a single font available to the theming
 *   subsystem.
 *
 *   The theming package ships a small default registry (Inter,
 *   Geist, DM Sans, IBM Plex Mono, JetBrains Mono, ...). Consumers
 *   extend the registry via
 *   `ThemingModule.forFeature({ fonts: [...] })` — every entry
 *   matches this shape.
 *
 *   Consumed by:
 *   - `ThemeService` at boot to inject the font `<link>` when a
 *     theme's `values.fontFamily` matches an entry's id.
 *   - `<FontFamilyPopover>` (theme editor UI) to render the font
 *     picker.
 */

/**
 * Metadata describing a font that themes may reference.
 */
export interface IFontConfig {
  /**
   * Stable identifier stored on `IThemeValues.fontFamily`. Follows
   * kebab-case: `"inter"`, `"dm-sans"`, `"ibm-plex-mono"`.
   */
  readonly id: string;

  /** Human-readable label for pickers ("Inter", "DM Sans"). */
  readonly label: string;

  /**
   * CSS custom-property name the theming layer sets to the font's
   * family name. Consumed by `--font-sans: var(--font-inter)` in
   * the runtime CSS. Include the leading `--`.
   */
  readonly variable: string;

  /**
   * URL to load the font's stylesheet from. Google Fonts CDN URLs
   * work directly. The theming module injects a `<link>` referencing
   * this URL on first use.
   */
  readonly cdnUrl: string;
}
