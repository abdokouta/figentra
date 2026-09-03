/**
 * @file language-toggle-footer.zone.tsx
 * @module @stackra/i18n/react/zones/language-toggle-footer
 * @description Zone contribution for the compact
 *   {@link LanguageToggle} in
 *   {@link NAVIGATION_ZONES.FOOTER_BOTTOM}.
 *
 *   Same widget the header hosts — secondary placement so
 *   visitors who scrolled past the header still find a locale
 *   control alongside the copyright line.
 *
 *   ## Registration
 *
 *   ```ts
 *   ZonesModule.forFeature({
 *     source: "@stackra/i18n",
 *     zones: [languageToggleFooterZone],
 *   })
 *   ```
 *
 *   ## Ordering
 *
 *   `position: "start"`, `order: 50` — renders BEFORE the
 *   intrinsic copyright line in the footer bottom row.
 */

import { NAVIGATION_ZONES } from "@stackra/contracts";
import { defineZone } from "@stackra/zones";

import { LanguageToggle } from "../components/language-toggle";

/**
 * Zone contribution: the compact `<LanguageToggle>` in the
 * navigation footer bottom row.
 */
export const languageToggleFooterZone = defineZone({
  id: "i18n.footer.language-toggle",
  zone: NAVIGATION_ZONES.FOOTER_BOTTOM,
  kind: "react",
  position: "start",
  order: 50,
  component: LanguageToggle,
});
