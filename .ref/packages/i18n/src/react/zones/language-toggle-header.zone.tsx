/**
 * @file language-toggle-header.zone.tsx
 * @module @stackra/i18n/react/zones/language-toggle-header
 * @description Zone contribution for the compact
 *   {@link LanguageToggle} in {@link NAVIGATION_ZONES.HEADER_END}.
 *
 *   Two-locale click-cycler variant — tight header slots, dense
 *   chrome. Consumers with 3+ locales OR who prefer explicit
 *   labelled options pick its sibling
 *   {@link languageSelectorHeaderZone} instead.
 *
 *   ## Registration
 *
 *   ```ts
 *   ZonesModule.forFeature({
 *     source: "@stackra/i18n",
 *     zones: [languageToggleHeaderZone],
 *   })
 *   ```
 *
 *   ## Ordering
 *
 *   `position: "start"`, `order: 110` — sits AFTER the theming
 *   contribution (`order: 100`) in the header end cluster.
 */

import { NAVIGATION_ZONES } from "@stackra/contracts";
import { defineZone } from "@stackra/zones";

import { LanguageToggle } from "../components/language-toggle";

/**
 * Zone contribution: the compact `<LanguageToggle>` in the
 * navigation header end.
 */
export const languageToggleHeaderZone = defineZone({
  id: "i18n.header.language-toggle",
  zone: NAVIGATION_ZONES.HEADER_END,
  kind: "react",
  position: "start",
  order: 110,
  component: LanguageToggle,
});
