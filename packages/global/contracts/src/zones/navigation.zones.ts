/**
 * @file navigation.zones.ts
 * @module @stackra/contracts/zones
 * @description Canonical zone identifiers owned by
 *   `@stackra/navigation`.
 *
 *   `<Zone id="navigation.*">` emitters render inside every
 *   navigation surface (`<NavSidebar>`, `<NavHeader>`, `<NavFooter>`,
 *   `<NavCommand>`, `<NavAccountMenu>`, `<NavMobileBar>`). Contributions
 *   land via `NavigationModule.forFeature({ zones: [...] })` per
 *   `.kiro/steering/zones-catalog.md` §Rule 1.
 *
 *   Menu contributions themselves flow through `menus: [...]` (the
 *   registry) — zones are the specialised extension points that
 *   render arbitrary React nodes (banners, chips, promos) alongside
 *   the menu.
 */

/**
 * Canonical zone identifiers owned by `@stackra/navigation`.
 */
export const NAVIGATION_ZONES = {
  /**
   * Sidebar header slot — above the menu, below the sidebar
   * trigger. Typical contributions: brand, tenant switcher,
   * workspace picker, breadcrumb reflector.
   *
   * Emitter: `<NavSidebar>` header region.
   * Context params: `{ location, collapsed, isMobile }`.
   */
  SIDEBAR_HEADER: "navigation.sidebar.header",

  /**
   * Sidebar footer slot — below the menu, at the bottom of the
   * sidebar. Typical contributions: user menu, help button, theme
   * switcher, version marker.
   *
   * Emitter: `<NavSidebar>` footer region.
   * Context params: `{ location, collapsed, isMobile }`.
   */
  SIDEBAR_FOOTER: "navigation.sidebar.footer",

  /**
   * Slot rendered ABOVE the sidebar menu list. Typical contributions:
   * search field, quick-command trigger, primary CTA.
   *
   * Emitter: `<NavSidebar>` above-menu region.
   * Context params: `{ location }`.
   */
  SIDEBAR_ABOVE_MENU: "navigation.sidebar.above-menu",

  /**
   * Slot rendered BELOW the sidebar menu list. Typical contributions:
   * secondary rail, ancillary shortcuts.
   *
   * Emitter: `<NavSidebar>` below-menu region.
   * Context params: `{ location }`.
   */
  SIDEBAR_BELOW_MENU: "navigation.sidebar.below-menu",

  /**
   * Header start zone — brand-adjacent, left of the main nav on LTR.
   *
   * Emitter: `<NavHeader>` start region.
   * Context params: `{ isScrolled }`.
   */
  HEADER_START: "navigation.header.start",

  /**
   * Header end zone — trailing edge, right of the main nav on LTR.
   * Typical contributions: search, notifications bell, account menu.
   *
   * Emitter: `<NavHeader>` end region
   * (`packages/frontend/navigation/src/react/components/nav-header/`).
   * Context params: `{ isScrolled }`.
   *
   * ## Current contributions
   *
   * Every contribution ships as a `defineZone(...)` export in a
   * dedicated `.zone.tsx` file — the declarative shape codified
   * in `.kiro/steering/zones-catalog.md` §Rule 8 and
   * `.kiro/steering/module-lifecycle.md` §"`forFeature`"
   * (ADR-0052). Consumers register via
   * `ZonesModule.forFeature({ zones: [...] })`.
   *
   * Framework-tier (auto-registered when the module boots):
   *
   * - `@stackra/theming` — `theming.header.theme-selector`
   *   (`ThemeSelector` dropdown, `position: "start"`, `order: 100`).
   *   Registered from `WebThemingModule.forRoot` via
   *   `ZonesModule.forFeature`. Source:
   *   `packages/frontend/theming/src/react/zones/theme-selector.zone.tsx`.
   *   Sibling `themeSwitcherZone` (compact icon-cycler) is
   *   available in the same barrel for consumers who prefer
   *   the tighter chrome.
   * - `@stackra/i18n` — `i18n.header.language-selector`
   *   (`LanguageSelector` dropdown with name + flag per locale,
   *   `position: "start"`, `order: 110`). Registered from
   *   `WebI18nModule.forRoot`. Source:
   *   `packages/frontend/i18n/src/react/zones/language-selector-header.zone.tsx`.
   *   Sibling `languageToggleHeaderZone` (compact two-locale
   *   click-cycler) available in the same barrel.
   *
   * App-tier (registered by the consuming app):
   *
   * - `academorix-landing` — `landing.header.auth-ctas`
   *   (`HeaderEndActions`: Log in + Get started `<a>`s pointing at
   *   the external Academorix dashboard, `position: "end"`,
   *   `order: 200`). Source:
   *   `apps/academorix-landing/src/zones/landing-auth-ctas.zone.tsx`.
   *   Kept app-local because the URLs are product-specific
   *   (`academorix.app/{login,signup}`).
   *
   * Visual left-to-right rendering (LTR):
   * `[ThemeSelector] [LanguageSelector] ... [Log in] [Get started]`
   *
   * ## Order
   *
   * Deterministic — `position: "start"` items resolve before
   * `position: "end"` items, then by numeric `order` (ascending),
   * stable on ties.
   */
  HEADER_END: "navigation.header.end",

  /**
   * Header center zone — center of the navbar (search field slot).
   *
   * Emitter: `<NavHeader>` center region.
   * Context params: `{ isScrolled }`.
   */
  HEADER_CENTER: "navigation.header.center",

  /**
   * Footer top slot — above every column. Typical contributions:
   * newsletter signup, social buttons, region selector.
   *
   * Emitter: `<NavFooter>` top region.
   */
  FOOTER_TOP: "navigation.footer.top",

  /**
   * Footer status slot — right-aligned end of the copyright row.
   * Typical contribution: a "System status" chip linking to the
   * app's status page (Vercel- / Linear-style "All systems
   * operational" indicator with a live-status dot).
   *
   * Emitter: `<NavFooter>` bottom-row end region
   * (`packages/frontend/navigation/src/react/components/nav-footer/`).
   *
   * Renders as a sibling to the `FOOTER_BOTTOM` zone inside the
   * copyright-row flex container. `justify-between` on that
   * container pushes this zone's contribution to the right edge
   * on LTR (left edge on RTL — handled by CSS logical properties).
   *
   * ## Current contributions
   *
   * - `academorix-landing` — `landing.footer.system-status`
   *   (`SystemStatusChip`: green-dot pill linking to
   *   `/status`, `position: "end"`, `order: 100`).
   *   Kept app-local because the status-page URL is
   *   product-specific.
   *
   * ## Order
   *
   * Position `"start"` items render before `"end"` items (rare —
   * one contribution is the norm). Numeric `order` ascending
   * within a position, stable on ties.
   */
  FOOTER_STATUS: "navigation.footer.status",

  /**
   * Footer bottom slot — below every column, alongside the
   * copyright. Typical contributions: legal links, language picker.
   *
   * Emitter: `<NavFooter>` bottom region
   * (`packages/frontend/navigation/src/react/components/nav-footer/`).
   *
   * ## Current contributions
   *
   * - `@stackra/i18n` — `i18n.footer.language-toggle`
   *   (`LanguageToggle`, `position: "start"`, `order: 50`).
   *   Compact two-locale click-cycler — secondary placement so
   *   visitors who scrolled past the header still find a locale
   *   control alongside the copyright. Registered from
   *   `WebI18nModule.forRoot` via `ZonesModule.forFeature`.
   *   Source:
   *   `packages/frontend/i18n/src/react/zones/language-toggle-footer.zone.tsx`.
   *
   * ## Order
   *
   * Position `"start"` renders BEFORE the intrinsic copyright
   * line; position `"end"` renders AFTER.
   */
  FOOTER_BOTTOM: "navigation.footer.bottom",

  /**
   * Command palette footer slot — below the results, above the
   * status bar. Typical contributions: quick-actions, tips.
   *
   * Emitter: `<NavCommand>` footer region.
   */
  COMMAND_FOOTER: "navigation.command.footer",

  /**
   * Mobile bar slot — bottom-of-viewport mobile nav. Typical
   * contributions: quick-actions FAB.
   *
   * Emitter: `<NavMobileBar>`.
   */
  MOBILE_BAR: "navigation.mobile.bar",
} as const;

/** Union of every zone identifier owned by `@stackra/navigation`. */
export type NavigationZoneId =
  (typeof NAVIGATION_ZONES)[keyof typeof NAVIGATION_ZONES];
