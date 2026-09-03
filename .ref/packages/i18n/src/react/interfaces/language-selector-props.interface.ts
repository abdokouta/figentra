/**
 * @file language-selector-props.interface.ts
 * @module @stackra/i18n/react/interfaces
 * @description Props for the `<LanguageSelector />` component.
 */

import type { LocaleItem } from "./locale-item.interface";

/**
 * Props for the `LanguageSelector` component.
 *
 * The selector renders a HeroUI `Popover` + `Button` trigger +
 * `ListBox` menu — the same shape as `<ThemeSelector>` from
 * `@stackra/theming/react` so header controls read as a coherent
 * pair (button-triggered dropdowns, not text-input comboboxes).
 *
 * Every list item shows `[flag] [name]`; the trigger renders
 * `[flag] [CODE]` (compact) or `[flag] [name]` (expanded).
 *
 * ## Compact vs. expanded trigger
 *
 * The trigger shape is controlled by
 * {@link LanguageSelectorProps.compact}:
 *
 * - `compact === true` (default) — trigger reads `[flag] [CODE]`
 *   (`🇺🇸 EN`). Suited for both header AND footer slots so both
 *   read as a coherent pair per the workspace's marketing style.
 * - `compact === false` — trigger reads `[flag] [name]`
 *   (`🇺🇸 English`). Suited for settings screens with room to
 *   breathe.
 *
 * The list items ALWAYS show the full `[flag] [name]` shape,
 * regardless of `compact` — the compact prop only tunes the
 * trigger; the menu stays legible.
 */
export interface LanguageSelectorProps {
  /** Custom label text. Default: no visible label. */
  readonly label?: string;
  /** Custom locale items — falls back to `supportedLocales` with `code` used as name. */
  readonly locales?: LocaleItem[];
  /** Passthrough className for layout composition. */
  readonly className?: string;
  /** Placeholder text. Default: "Select language". */
  readonly placeholder?: string;
  /**
   * Accessible name for the ComboBox when no visible `label` is
   * supplied. React Aria warns when neither is present. Default:
   * `"Language"`.
   */
  readonly "aria-label"?: string;
  /**
   * When `true` (default), the trigger renders the current locale
   * as `[flag] [CODE]` (`🇺🇸 EN`) — a tight one-glyph-plus-two-
   * letter shape that reads well in both header AND footer slots.
   * When `false`, the trigger renders the full `[flag] [name]`
   * (`🇺🇸 English`) — suited for settings screens with room to
   * breathe.
   *
   * The dropdown list items ignore this flag — they always show
   * `[flag] [name]` regardless of the compact setting so users
   * can pick from a legible menu even inside a compact trigger.
   *
   * @default true
   */
  readonly compact?: boolean;
}
