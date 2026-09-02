/**
 * @file footer-config.interface.ts
 * @module @stackra/contracts/interfaces/navigation
 * @description Configuration surface for `<NavFooter>` — a site
 *   footer composed from `<NavMenu variant="columns">`.
 *
 *   The footer supports:
 *
 *   - Column layout with per-breakpoint counts.
 *   - Copyright + legal-links row.
 *   - Multi-column header (top slot) — newsletter signup, social.
 *   - Multi-column body — nested `IMenuItem` groups.
 *   - Optional bottom slot — legal disclaimer, region selector.
 *   - Optional floating slot — back-to-top button.
 *   - Placement variants — static, sticky-bottom, fixed-bottom,
 *     floating, reveal-on-scroll-end, compact, expanded.
 *
 *   Column contribution: each item at the top level of the footer
 *   menu becomes ONE column; its `children` become the column's
 *   entries. Layout tokens on the menu (`density`, `columns`,
 *   `containerWidth`, `padding`, `background`) drive the visual.
 */

import type { IMenuFooterPlacement } from "./menu.interface";

/**
 * Config shape for `<NavFooter>`. Every field is optional; sensible
 * defaults ship.
 */
export interface IFooterConfig {
  // ── Menu locations ──────────────────────────────────────────
  /** Menu location for the column body. Default `"footer"`. */
  readonly location?: string;
  /** Optional secondary location for a bottom-row menu (legal). */
  readonly bottomLocation?: string;

  // ── Placement + behaviour ───────────────────────────────────
  /** Placement variant; default `"static"`. */
  readonly placement?: IMenuFooterPlacement;
  /** Whether to show the floating back-to-top button. Default `false`. */
  readonly showBackToTop?: boolean;

  // ── Copyright ───────────────────────────────────────────────
  /** Copyright entity name (e.g. `"Acme Inc."`). */
  readonly copyrightHolder?: string;
  /** Copyright year (defaults to `new Date().getFullYear()`). */
  readonly copyrightYear?: number;
  /** Additional copyright suffix (e.g. `"All rights reserved."`). */
  readonly copyrightSuffix?: string;
}
