/**
 * @file language-selector-footer.zone.tsx
 * @module @stackra/i18n/react/zones/language-selector-footer
 * @description Zone contribution for the explicit-dropdown
 *   {@link LanguageSelector} in
 *   {@link NAVIGATION_ZONES.FOOTER_BOTTOM}.
 *
 *   Footer sibling of {@link languageSelectorHeaderZone}. Renders
 *   in COMPACT mode (`[flag] [CODE]`) so header + footer trigger
 *   shapes match — per direct user feedback 2026-07-31: "the
 *   footer language switcher, we need to use the same selector".
 *
 *   ## Configuration
 *
 *   The rendered `[flag] [name]` list is derived from the app's
 *   `II18nConfig.locales` map — hardcoding a display array here
 *   would duplicate the app-level config. See the header zone
 *   docblock for the full rationale.
 *
 *   ## Registration
 *
 *   ```ts
 *   ZonesModule.forFeature({
 *     source: "@stackra/i18n",
 *     zones: [languageSelectorFooterZone],
 *   })
 *   ```
 *
 *   ## Ordering
 *
 *   `position: "start"`, `order: 60` — renders BEFORE the
 *   intrinsic copyright line in the footer bottom row and AFTER
 *   the `languageToggleFooterZone` (order 50) when both are
 *   contributed simultaneously. Do NOT register both in the same
 *   app; the footer would render two locale controls.
 */

import { NAVIGATION_ZONES } from "@stackra/contracts";
import { defineZone } from "@stackra/zones";
import { createElement, type ReactElement } from "react";

import { LanguageSelector } from "../components/language-selector";

/**
 * Thin adapter — `<LanguageSelector>` in compact mode. Reads its
 * display list from `useI18n().locales` (config-driven), no
 * hardcoded array. Kept at module scope so React sees a stable
 * component identity across zone re-renders.
 */
function LanguageSelectorAdapter(): ReactElement {
  return createElement(LanguageSelector, { compact: true });
}

LanguageSelectorAdapter.displayName = "LanguageSelectorFooterAdapter";

/**
 * Zone contribution: the dropdown `<LanguageSelector>` at
 * `NAVIGATION_ZONES.FOOTER_BOTTOM`.
 */
export const languageSelectorFooterZone = defineZone({
  id: "i18n.footer.language-selector",
  zone: NAVIGATION_ZONES.FOOTER_BOTTOM,
  kind: "react",
  position: "start",
  order: 60,
  component: LanguageSelectorAdapter,
});
