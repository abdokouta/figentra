/**
 * @file menu.interface.ts
 * @module @stackra/contracts/interfaces/navigation
 * @description The `IMenu` shape — one menu contribution per location.
 *
 *   A `location` is a stable identifier the consumer wires against
 *   (`"primary"`, `"footer"`, `"account"`, `"mobile"`, `"help"`,
 *   `"command-palette"`). Multiple packages register menus for the
 *   same location; the registry merges + orders + de-dupes contributions
 *   at render time.
 *
 *   Layout tokens on this interface (`density`, `surface`,
 *   `background`, `border`, `padding`, `containerWidth`, `columns`,
 *   `placement`, `sticky`, `hideOnScroll`) drive the surface
 *   component's styling — `<NavFooter>`, `<NavNavbar>`, `<NavHeader>`
 *   read them when rendering a menu. Consumers can override at the
 *   component level.
 */

import type { IMenuItem } from "./menu-item.interface";

/**
 * Overall visual density. Every surface downshifts padding, gaps,
 * and typography when `"compact"` is selected.
 */
export type MenuDensity = "compact" | "comfortable" | "spacious";

/**
 * Elevation / surface treatment. `"flat"` is the default; `"elevated"`
 * adds a shadow; `"bordered"` adds a hairline border.
 */
export type MenuSurface = "flat" | "elevated" | "bordered";

/**
 * Background treatment token.
 */
export type MenuBackground =
  "default" | "translucent" | "transparent" | "accent";

/**
 * Border placement — used by footer / header surfaces to draw a hairline.
 */
export type MenuBorder = "none" | "top" | "bottom" | "y";

/**
 * Inner padding token.
 */
export type MenuPadding = "none" | "sm" | "md" | "lg";

/**
 * Container width token — max-width class the surface applies.
 */
export type MenuContainerWidth = "narrow" | "normal" | "wide" | "full";

/**
 * Placement variant for footer menus. Consumed by `<NavFooter>`.
 */
export type MenuFooterPlacement =
  | "static"
  | "sticky-bottom"
  | "fixed-bottom"
  | "floating"
  | "reveal-on-scroll-end"
  | "compact"
  | "expanded";

/**
 * Column policy for column-layout menus (footers, mega menus).
 */
export interface IMenuColumns {
  /** Base columns on mobile (default `1`). */
  readonly mobile?: 1 | 2 | 3 | 4;
  /** Columns on tablet (default `2`). */
  readonly tablet?: 1 | 2 | 3 | 4;
  /** Columns on desktop (default `4`). */
  readonly desktop?: 1 | 2 | 3 | 4 | 5 | 6;
  /** Gap size between columns; default `"md"`. */
  readonly gap?: "sm" | "md" | "lg";
}

/**
 * A menu contribution for one location.
 *
 * @example
 * ```typescript
 * const menu: IMenu = {
 *   id: "rbac-primary-menu",
 *   location: "primary",
 *   label: "Primary navigation",
 *   items: [{ id: "roles", kind: "link", label: "Roles", to: "/rbac/roles" }],
 *   density: "comfortable",
 * };
 * ```
 */
export interface IMenu {
  /** Stable id — globally unique across every registered menu. */
  readonly id: string;
  /** Location key — the surface the menu targets. */
  readonly location: string;
  /** Optional human label — used for `<nav aria-label>`. */
  readonly label?: string;
  /** Ordered items. */
  readonly items: readonly IMenuItem[];

  // ── Layout tokens (consumed by surfaces) ────────────────────
  readonly density?: MenuDensity;
  readonly surface?: MenuSurface;
  readonly background?: MenuBackground;
  readonly border?: MenuBorder;
  readonly padding?: MenuPadding;
  readonly containerWidth?: MenuContainerWidth;
  readonly columns?: IMenuColumns;

  // ── Placement / scroll behaviour ────────────────────────────
  /** Footer placement — consumed by `<NavFooter>`. */
  readonly placement?: MenuFooterPlacement;
  /** Whether the surface is sticky at the top; navbar/header. */
  readonly sticky?: boolean;
  /** Whether the surface hides on scroll down; navbar/header. */
  readonly hideOnScroll?: boolean;

  // ── Meta ────────────────────────────────────────────────────
  /** Arbitrary consumer-defined metadata. */
  readonly meta?: Record<string, unknown>;
}

/**
 * Alias — public re-export of the layout tokens above under short
 * names. Some earlier reference code imported them from
 * `menu.interface.ts` — keep this shape so both aliases work.
 */
export type {
  MenuDensity as IMenuDensity,
  MenuSurface as IMenuSurface,
  MenuBackground as IMenuBackground,
  MenuBorder as IMenuBorder,
  MenuPadding as IMenuPadding,
  MenuContainerWidth as IMenuContainerWidth,
  MenuFooterPlacement as IMenuFooterPlacement,
};
