/**
 * @file language-combobox-props.interface.ts
 * @module @stackra/i18n/react/interfaces
 * @description Props for the `<LanguageCombobox />` component.
 */

import type { LocaleItem } from "./locale-item.interface";

/**
 * Props for the `LanguageCombobox` component.
 *
 * `<LanguageCombobox>` renders a HeroUI `ComboBox` — a text input
 * paired with a filterable popover of locale items. Distinct
 * from the sibling {@link LanguageSelectorProps} which uses a
 * button-triggered dropdown:
 *
 * - `<LanguageSelector>` — button + popover + listbox. No
 *   free-text search. Cheapest visual footprint. Best for
 *   headers with two or three locales.
 * - `<LanguageCombobox>` — text input + popover. On focus /
 *   open, the input becomes a filter (typing narrows the list).
 *   Best for settings screens and apps supporting 5+ locales
 *   where free-text search saves clicks.
 *
 * Every list item shows `[flag] [name]` with a check indicator
 * on the current selection. The input value defaults to the
 * selected item's `textValue` (`"🇺🇸 English"`) after
 * selection.
 *
 * The trigger + input DO NOT split into a "compact" and
 * "expanded" variant like `<LanguageSelector>` because the
 * ComboBox anatomy always renders a text input (there's no
 * icon-only shape).
 */
export interface LanguageComboboxProps {
  /** Optional visible label rendered above the input. */
  readonly label?: string;

  /**
   * Custom locale items. Falls back to the config-driven
   * `II18nConfig.locales` (or the derived `{ code, name: code }`
   * shape for codes without an explicit config entry).
   */
  readonly locales?: LocaleItem[];

  /** Passthrough className for layout composition. */
  readonly className?: string;

  /**
   * Placeholder rendered inside the ComboBox input when no
   * locale is selected + no filter text has been typed.
   *
   * @default "Search language…"
   */
  readonly placeholder?: string;

  /**
   * Accessible-name override for the ComboBox. Defaults to a
   * dynamic label reflecting the current locale
   * (`"Language: English"`).
   */
  readonly "aria-label"?: string;

  /**
   * How the popover opens.
   *
   * - `"focus"` (default) — opens on input focus, matches the
   *   settings-screen / command-palette feel every consumer
   *   expects.
   * - `"input"` — opens only when the user types.
   * - `"manual"` — opens only via the trigger button click.
   *
   * @default "focus"
   */
  readonly menuTrigger?: "focus" | "input" | "manual";
}
