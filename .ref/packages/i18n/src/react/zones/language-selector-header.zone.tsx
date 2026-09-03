/**
 * @file language-selector-header.zone.tsx
 * @module @stackra/i18n/react/zones/language-selector-header
 * @description Zone contribution for the explicit-dropdown
 *   {@link LanguageSelector} in {@link NAVIGATION_ZONES.HEADER_END}.
 *
 *   Uses HeroUI's `Popover` + `Button` + `ListBox` under the
 *   hood — the same shape as `<ThemeSelector>` from
 *   `@stackra/theming/react` so both header controls read as a
 *   coherent pair. Preferred over the two-locale click-toggle
 *   when:
 *
 *   - The app supports 3+ locales.
 *   - The header has breathing room (marketing / landing /
 *     dashboard shells).
 *   - The visitor benefits from seeing every option at a glance.
 *
 *   Compact click-cycler consumers pick
 *   {@link languageToggleHeaderZone} instead.
 *
 *   ## Configuration
 *
 *   The rendered `[flag] [name]` list is derived from the app's
 *   `II18nConfig.locales` map (bound at
 *   `I18nModule.forRoot({ locales: [...] })`). The zone contributes
 *   NO local display map — hardcoding one here would duplicate the
 *   app-level config and drift the moment a new locale ships. Every
 *   consumer app SHOULD populate `locales: [{ code, name, flag? }]`
 *   in its i18n config; the component falls back to
 *   `{ code, name: code }` for any supported locale without an entry.
 *
 *   ## Registration
 *
 *   ```ts
 *   ZonesModule.forFeature({
 *     source: "@stackra/i18n",
 *     zones: [languageSelectorHeaderZone],
 *   })
 *   ```
 *
 *   ## Ordering
 *
 *   Same slot as `languageToggleHeaderZone` —
 *   `position: "start"`, `order: 110`. Do NOT register both in
 *   the same app; the header would render two locale controls.
 */

import { NAVIGATION_ZONES } from "@stackra/contracts";
import { defineZone } from "@stackra/zones";
import { createElement, type ReactElement } from "react";

import { LanguageSelector } from "../components/language-selector";

/**
 * Thin adapter — `<LanguageSelector>` in compact mode. The
 * component reads its display list from `useI18n().locales`
 * (fed by `II18nConfig.locales` at boot); this adapter never
 * hardcodes a locale array.
 *
 * Kept at module scope so React sees a stable component
 * identity (inline arrows would remount on every zone render).
 */
function LanguageSelectorAdapter(): ReactElement {
  return createElement(LanguageSelector, { compact: true });
}

LanguageSelectorAdapter.displayName = "LanguageSelectorHeaderAdapter";

/**
 * Zone contribution: the dropdown `<LanguageSelector>` at
 * `NAVIGATION_ZONES.HEADER_END`.
 */
export const languageSelectorHeaderZone = defineZone({
  id: "i18n.header.language-selector",
  zone: NAVIGATION_ZONES.HEADER_END,
  kind: "react",
  position: "start",
  order: 110,
  component: LanguageSelectorAdapter,
});
