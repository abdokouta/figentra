/**
 * @file language-combobox-header.zone.tsx
 * @module @stackra/i18n/react/zones
 * @description Zone contribution — mounts {@link LanguageCombobox}
 *   at {@link NAVIGATION_ZONES.HEADER_END}.
 *
 *   The combobox variant is best for settings screens and apps
 *   that support 5+ locales where free-text search saves clicks.
 *   Apps that ship fewer locales typically prefer the sibling
 *   {@link languageSelectorHeaderZone} (button-triggered
 *   dropdown, no search bar).
 *
 *   Registered by `WebI18nModule.forRoot({ control: "combobox" })`.
 *   Consumers who compose their own zone contribution reference
 *   this export directly.
 */

import { NAVIGATION_ZONES } from "@stackra/contracts";
import { defineZone } from "@stackra/zones";

import { LanguageCombobox } from "../components/language-combobox";

/**
 * Zone contribution: `<LanguageCombobox>` at
 * `NAVIGATION_ZONES.HEADER_END`.
 */
export const languageComboboxHeaderZone = defineZone({
  id: "i18n.header.language-combobox",
  zone: NAVIGATION_ZONES.HEADER_END,
  kind: "react",
  position: "start",
  order: 100,
  component: LanguageCombobox,
});
