/**
 * @file index.ts
 * @module @stackra/i18n/react/zones
 * @description Barrel for `@stackra/i18n`'s zone contributions.
 *
 *   Header end slot (`NAVIGATION_ZONES.HEADER_END`,
 *   `position: "start"`, `order: 110`) — pick ONE per app:
 *
 *   - {@link languageToggleHeaderZone} — compact two-locale
 *     cycler. Tight header slots.
 *   - {@link languageSelectorHeaderZone} — explicit ComboBox
 *     dropdown (`compact={true}`, renders `🇺🇸 EN` in the
 *     trigger). Marketing / dashboard shells.
 *
 *   Footer bottom slot (`NAVIGATION_ZONES.FOOTER_BOTTOM`) — pick
 *   ONE per app (or none):
 *
 *   - {@link languageToggleFooterZone} — compact toggle
 *     (`order: 50`).
 *   - {@link languageSelectorFooterZone} — explicit ComboBox
 *     dropdown (`compact={false}`, renders `🇺🇸 English` in the
 *     trigger) (`order: 60`).
 */

export { languageComboboxHeaderZone } from "./language-combobox-header.zone";
export { languageSelectorFooterZone } from "./language-selector-footer.zone";
export { languageSelectorHeaderZone } from "./language-selector-header.zone";
export { languageToggleFooterZone } from "./language-toggle-footer.zone";
export { languageToggleHeaderZone } from "./language-toggle-header.zone";
