/**
 * @file header-config.interface.ts
 * @module @stackra/contracts/interfaces/navigation
 * @description Configuration surface for `<NavHeader>` — the sticky
 *   application header composed from HeroUI Pro's `Navbar` primitive.
 *
 *   `<NavHeader>` renders three logical zones — start / center / end —
 *   filled by menu contributions at the configured locations. The
 *   HeroUI Pro `Navbar` primitives (`Navbar.Brand`, `Navbar.Content`,
 *   `Navbar.MenuToggle`, `Navbar.Menu`, `Navbar.Spacer`) do the actual
 *   layout.
 */

/**
 * Header position — HeroUI Pro's `Navbar.position` prop.
 */
export type HeaderPosition = "sticky" | "static" | "floating";

/**
 * Header size — HeroUI Pro's `Navbar.size` prop.
 */
export type HeaderSize = "sm" | "md" | "lg";

/**
 * Max-width preset — HeroUI Pro's `Navbar.maxWidth` prop.
 */
export type HeaderMaxWidth = "sm" | "md" | "lg" | "xl" | "2xl" | "full";

/**
 * Config shape for `<NavHeader>`. Every field is optional; sensible
 * defaults ship.
 */
export interface IHeaderConfig {
  // ── Layout ──────────────────────────────────────────────────
  /** Position; default `"sticky"`. */
  readonly position?: HeaderPosition;
  /** Size; default `"md"`. */
  readonly size?: HeaderSize;
  /** Max width; default `"xl"`. */
  readonly maxWidth?: HeaderMaxWidth;
  /** Explicit height (CSS length). Overrides `size`. */
  readonly height?: string;
  /** Whether to hide the header on scroll down. Default `false`. */
  readonly hideOnScroll?: boolean;
  /** Whether the mobile menu overlays page content. Default `true`. */
  readonly shouldBlockScroll?: boolean;

  // ── Menu locations ──────────────────────────────────────────
  /** Menu location for the start (brand-adjacent) zone. Default `"primary"`. */
  readonly startLocation?: string;
  /** Menu location for the center zone. Optional. */
  readonly centerLocation?: string;
  /** Menu location for the end zone (account, actions). Default `"header-end"`. */
  readonly endLocation?: string;
  /**
   * Menu location for the mobile drawer opened by `Navbar.MenuToggle`.
   * Default `"mobile"`.
   */
  readonly mobileLocation?: string;

  // ── Brand ───────────────────────────────────────────────────
  /** Brand text (falls back to tenant.displayName from context). */
  readonly brandLabel?: string;
  /** Brand logo image URL. */
  readonly brandLogo?: string;
  /** Alt text for the brand logo. */
  readonly brandLogoAlt?: string;
  /** Href for the brand link. Default `"/"`. */
  readonly brandHref?: string;
}
