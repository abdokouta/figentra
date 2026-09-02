/**
 * @file menu-item.interface.ts
 * @module @stackra/contracts/interfaces/navigation
 * @description Rich menu-item schema consumed by `@stackra/navigation` —
 *   covers every use case the WordPress-era CMS shipped (nested,
 *   sectioned, per-role visibility, per-breakpoint visibility, custom
 *   markup, banners, external links, actions, dropdowns, mega menus)
 *   without shipping a WordPress-shaped API.
 *
 *   Every navigation surface (`<NavSidebar>`, `<NavNavbar>`,
 *   `<NavFooter>`, `<NavBreadcrumb>`, `<NavTabs>`, `<NavCommand>`,
 *   `<NavMegaMenu>`, `<NavAccountMenu>`, `<NavMobileBar>`,
 *   `<NavBanner>`) walks a tree of `IMenuItem` records and renders
 *   the matching HeroUI Pro primitive.
 *
 *   Ordering:
 *   - `order?: number` — ascending; missing → treated as `0`.
 *   - Stable when equal (input order preserved).
 *
 *   Runtime gating (evaluated by `<NavItem>`):
 *   - `hideOn` — per-breakpoint suppression.
 *   - `auth` — anonymous / authenticated / any.
 *   - `requiresPermission` — permission string, resolved from context.
 *   - `requiresFeature` — feature-flag key, resolved from context.
 *   - `when(ctx)` — sync predicate, receives `INavigationContext`.
 *
 *   Custom rendering:
 *   - `render(item, ctx)` — full override; skip the built-in renderer.
 *   - `className`, `containerClassName`, `labelClassName`, `style` —
 *     applied to the rendered primitive.
 *
 *   Docblocks below name the runtime contract each field participates
 *   in — do NOT rename a field without updating every downstream
 *   surface + the workspace inventory
 *   (`.kiro/plans/navigation-workspace-inventory.md`).
 */

import type { INavigationContext } from "./navigation-context.interface";
import type { CSSProperties, ReactNode } from "react";

/**
 * The set of primitive kinds `<NavItem>` dispatches on. The
 * discriminator drives rendering: `"link"` becomes an anchor,
 * `"action"` becomes a button, `"separator"` becomes a rule,
 * `"banner"` becomes a `<NavBanner>`, and so on.
 *
 * `"custom"` bypasses the built-in dispatcher entirely — the item's
 * `render(item, ctx)` callback returns the final node.
 */
export type MenuItemKind =
  | "link" // internal route via @stackra/routing/react
  | "external" // external URL, always renders `<a target>` with `rel`
  | "action" // dispatch an `@stackra/actions` handler
  | "resource" // resource-aware navigation (list / show / edit / create)
  | "separator" // horizontal / vertical divider
  | "header" // static group heading
  | "group" // nested collection with its own children
  | "dropdown" // opens a popover with children
  | "mega-menu" // opens a mega-menu with columns
  | "banner" // renders `<NavBanner>` inline
  | "custom"; // render callback owns the node

/**
 * Which authentication state an item is visible under.
 *
 * - `"any"` (default) — visible regardless of auth.
 * - `"authenticated"` — only rendered when `INavigationContext.authenticated`.
 * - `"anonymous"` — only rendered when NOT authenticated.
 */
export type MenuAuthGate = "any" | "authenticated" | "anonymous";

/**
 * Breakpoint suppression bitmap. When set to `true`, `<NavItem>`
 * skips rendering the item on that viewport. Multiple flags stack
 * additively (`hideOn: { mobile: true, tablet: true }` renders on
 * desktop only).
 */
export interface IMenuItemBreakpointGate {
  /** ≤640px */
  readonly mobile?: boolean;
  /** ≤1024px */
  readonly tablet?: boolean;
  /** >1024px */
  readonly desktop?: boolean;
}

/**
 * Color preset for a menu-item badge chip. Maps to HeroUI's semantic
 * color tokens.
 *
 * `"accent"` is HeroUI's brand accent (equivalent to legacy
 * `"primary"`). `"primary"` is kept as an alias so consumers reading
 * this from the wire can pass either name.
 */
export type MenuBadgeColor =
  "default" | "accent" | "primary" | "success" | "warning" | "danger";

/**
 * A small badge chip rendered inside a menu item — e.g. an unread
 * count, a `NEW` marker, a `BETA` tag.
 */
export interface IMenuBadge {
  /** Text or numeric content of the badge. */
  readonly label: string | number;
  /** Semantic color; default is `"primary"`. */
  readonly color?: MenuBadgeColor;
  /** ARIA label override (defaults to the visible label). */
  readonly ariaLabel?: string;
}

/**
 * Right-hand featured card on a `mega-menu`-kind item — the
 * Vercel-style promo tile that lives beside the column grid.
 * Attach ONE per mega menu; renders as an accent-tinted card
 * with an icon puck, title, description, and an optional CTA
 * label ending in a trailing arrow.
 *
 * @example
 * ```ts
 * {
 *   id: "products-mega",
 *   kind: "mega-menu",
 *   label: "Products",
 *   children: [ ... columns ... ],
 *   featured: {
 *     eyebrow: "New",
 *     title: "AI Engine",
 *     description: "An AI operator that reads your workspace.",
 *     icon: "sparkle",
 *     to: "/products/ai-engine",
 *     ctaLabel: "Explore →",
 *   },
 * }
 * ```
 */
export interface IMegaMenuFeatured {
  /**
   * Small pill above the title — e.g. `"New"`, `"Popular"`,
   * `"Beta"`. Optional.
   */
  readonly eyebrow?: string;
  /** Primary card headline. */
  readonly title: string;
  /** Supporting description under the title. */
  readonly description?: string;
  /**
   * Icon shown in an accent-tinted puck at the top of the card.
   * Same shape as `IMenuItem.icon` — string names resolve through
   * the workspace `Iconify` renderer, ReactNode passthroughs
   * inline.
   */
  readonly icon?: ReactNode | string;
  /**
   * Optional decorative image URL. Placement depends on
   * `imagePlacement` — top-of-card by default (backward
   * compatible), can also render as a full-card background OR to
   * the right of the copy.
   */
  readonly image?: string;
  /** Alt text for `image`; default empty. */
  readonly imageAlt?: string;
  /**
   * Where the `image` renders relative to the card copy.
   *
   * - `"top"` (default) — image sits above the copy, aspect-video,
   *   rounded corners. Vercel-Docs / Linear-changelog aesthetic.
   * - `"background"` — image fills the entire card as a
   *   background; copy overlays with a dark-to-transparent scrim
   *   for legibility. Vercel-homepage-featured aesthetic.
   * - `"right"` — image renders to the right of the copy on wider
   *   viewports; copy stacks under the image on mobile.
   *
   * Ignored when `image` is unset. Falls back to `icon`-only
   * rendering when neither `image` nor `imagePlacement` are
   * present.
   *
   * @default "top"
   */
  readonly imagePlacement?: "top" | "background" | "right";
  /** Internal route target when the whole card links. */
  readonly to?: string;
  /** External URL alternative to `to`. */
  readonly href?: string;
  /** Trailing CTA label; defaults to `"Explore →"` when omitted. */
  readonly ctaLabel?: string;
  /** Additional class applied to the outer card container. */
  readonly className?: string;
}

/**
 * A tag chip rendered next to a menu item's label — e.g. a
 * category label ("NEW", "PRO", "BETA").
 */
export interface IMenuTag {
  /** Chip label. */
  readonly label: string;
  /** HeroUI Chip color; default `"default"`. */
  readonly color?: MenuBadgeColor;
  /**
   * HeroUI Chip visual style; default `"soft"`. Values map to
   * HeroUI's Chip variants.
   */
  readonly variant?: "primary" | "secondary" | "tertiary" | "soft";
}

/**
 * Visual variant for banner-kind items.
 *
 * - `"info"` — neutral / marketing.
 * - `"success"` — positive confirmation.
 * - `"warning"` — attention required.
 * - `"danger"` — critical.
 * - `"promo"` — promotional / upgrade prompt.
 */
export type MenuBannerVariant =
  "info" | "success" | "warning" | "danger" | "promo";

/**
 * Explicit ARIA overrides for a menu item.
 */
export interface IMenuItemAria {
  readonly label?: string;
  readonly describedBy?: string;
  readonly current?:
    "page" | "step" | "location" | "date" | "time" | "true" | "false";
  readonly expanded?: boolean;
}

/**
 * Rich menu-item record — the shape every navigation surface reads.
 *
 * Discriminated by `kind`; every renderer switches on it. Only
 * fields relevant to the kind are read at render time, so the
 * schema stays extensible without breaking older consumers.
 *
 * @example
 * ```tsx
 * const item: IMenuItem = {
 *   id: "roles",
 *   kind: "link",
 *   label: "Roles",
 *   to: "/rbac/roles",
 *   icon: "shield-check",
 *   badge: { label: 3, color: "warning" },
 *   requiresPermission: "rbac.roles.view",
 *   hideOn: { mobile: true },
 * };
 * ```
 */
export interface IMenuItem {
  // ── Identity ────────────────────────────────────────────────
  /** Stable id — used as React key + `<Zone>` anchor. */
  readonly id: string;
  /** Discriminator — decides which primitive renders. */
  readonly kind: MenuItemKind;

  // ── Label + description ─────────────────────────────────────
  /** Human-readable label — displayed by every surface. */
  readonly label?: string;
  /** Secondary line (command palette, mega menu, tooltips). */
  readonly description?: string;
  /** Custom class applied to the label element. */
  readonly labelClassName?: string;

  // ── Icons + imagery ─────────────────────────────────────────
  /**
   * Icon reference — resolved by the consumer's `resolveIcon` callback
   * (default: heroicons name) OR a full React node.
   */
  readonly icon?: ReactNode | string;
  /** Trailing icon (e.g. external-link arrow). Same shape as `icon`. */
  readonly iconRight?: ReactNode | string;
  /** Optional image URL — mega-menu / account-menu use this. */
  readonly image?: string;
  /** Alt text for `image`; default empty. */
  readonly imageAlt?: string;

  // ── Navigation targets ──────────────────────────────────────
  /** Internal route path (kind: "link"). */
  readonly to?: string;
  /** External URL (kind: "external" — also works for kind: "link"). */
  readonly href?: string;
  /** Anchor target — default `_self` internal, `_blank` external. */
  readonly target?: "_self" | "_blank" | "_parent" | "_top";
  /** Anchor `rel` — auto-set for external URLs. */
  readonly rel?: string;
  /** Download attribute — accepts filename or boolean. */
  readonly download?: string | boolean;

  // ── Resource-aware navigation ───────────────────────────────
  /** Resource name (kind: "resource"). */
  readonly resource?: string;
  /** Resource action; default `"list"`. */
  readonly action?: "list" | "show" | "create" | "edit" | "clone";
  /** Resource id (for `"show"` / `"edit"` / `"clone"`). */
  readonly resourceId?: string | number;

  // ── Action-dispatch targets ─────────────────────────────────
  /** Action key (kind: "action") — dispatched via `@stackra/actions`. */
  readonly actionKey?: string;
  /** Optional args passed to the action handler. */
  readonly actionArgs?: Record<string, unknown>;

  // ── Nested / composite structure ────────────────────────────
  /** Child items — walked by group / dropdown / mega-menu. */
  readonly children?: readonly IMenuItem[];
  /** Whether a group / dropdown is collapsible; default `true`. */
  readonly collapsible?: boolean;
  /** Whether a collapsible group starts open; default `false`. */
  readonly defaultOpen?: boolean;

  // ── Presentation modifiers ──────────────────────────────────
  /** Visual weight — CTA / primary rendering. */
  readonly cta?: boolean;
  /** Explicit button variant when `kind: "action"` or `cta: true`. */
  readonly variant?:
    | "primary"
    | "secondary"
    | "tertiary"
    | "ghost"
    | "outline"
    | "cta"
    | "default";
  /** Button size (HeroUI sm / md / lg). */
  readonly size?: "sm" | "md" | "lg";
  /** Highlight the item — used for "current app section" markers. */
  readonly highlight?: boolean;
  /** Whether the item is disabled (rendered but not interactive). */
  readonly disabled?: boolean;
  /** Small tag chips shown beside the label. */
  readonly tags?: readonly IMenuTag[];
  /** Badge chip shown at the trailing edge. */
  readonly badge?: IMenuBadge;
  /** Keyboard shortcut label (e.g. `"⌘K"`). */
  readonly shortcut?: string;

  // ── Banner-kind fields ──────────────────────────────────────
  /** Banner visual variant (kind: "banner"). */
  readonly bannerVariant?: MenuBannerVariant;
  /** Whether the banner ships a dismiss button. */
  readonly bannerDismissible?: boolean;
  /** Dismiss-key persisted in `@stackra/storage`. */
  readonly bannerDismissKey?: string;

  // ── Visibility gates (client-side) ──────────────────────────
  /** Which auth state renders this item. Default `"any"`. */
  readonly auth?: MenuAuthGate;
  /** Required permission string; default none. */
  readonly requiresPermission?: string | readonly string[];
  /** Required feature flag key; default none. */
  readonly requiresFeature?: string | readonly string[];
  /** Per-breakpoint suppression. */
  readonly hideOn?: IMenuItemBreakpointGate;
  /** Optional sync predicate — fully custom gate. */
  readonly when?: (ctx: INavigationContext) => boolean;

  // ── Active-state matching ───────────────────────────────────
  /**
   * When `true`, the item's `to` / `href` matches the current
   * pathname ONLY on strict string equality. Default: `false` —
   * the surface uses path-segment prefix matching so an item
   * `to: "/products"` also activates when the current path is
   * `/products/scheduling`.
   *
   * Set on leaf routes that share a prefix with an ancestor
   * menu entry — e.g., `Home` (`to: "/"`) sets `exact: true`
   * so every non-root page doesn't also light up the home
   * link. The root path is implicitly exact regardless of the
   * flag, so this only matters for non-root leaf routes.
   */
  readonly exact?: boolean;
  /**
   * Custom regex override for the active-state matcher. When
   * present, the surface skips both the default segment-prefix
   * matcher AND the `exact` flag, and lights the item up when
   * the regex tests true against the current pathname (query
   * strings and fragments stripped).
   *
   * Use when the default semantics can't express the shape —
   * e.g., matching every post in a specific year
   * (`/^\/blog\/2026(\/|$)/`) or two named siblings under one
   * highlight (`/^\/docs\/(getting-started|tutorial)(\/|$)/`).
   */
  readonly activeMatch?: RegExp;

  // ── Style overrides ─────────────────────────────────────────
  /** Class applied to the outer `<li>` container. */
  readonly containerClassName?: string;
  /** Class applied to the interactive element (anchor / button). */
  readonly className?: string;
  /** Inline style applied to the interactive element. */
  readonly style?: CSSProperties;

  // ── Ordering + meta ─────────────────────────────────────────
  /** Ascending render order; default `0`. Stable when equal. */
  readonly order?: number;
  /** Arbitrary metadata — consumer-defined (analytics, testing). */
  readonly meta?: Record<string, unknown>;

  // ── Analytics ───────────────────────────────────────────────
  /** Analytics event name emitted on activation. */
  readonly analyticsEvent?: string;
  /** Analytics properties merged into the event payload. */
  readonly analyticsProps?: Record<string, unknown>;

  // ── Accessibility ───────────────────────────────────────────
  /** Explicit ARIA overrides. */
  readonly aria?: IMenuItemAria;

  // ── Custom render ───────────────────────────────────────────
  /**
   * Full render override — receives the item + navigation context,
   * returns the final node. When present, no built-in primitive
   * fires. Use for one-off custom markup.
   */
  readonly render?: (item: IMenuItem, ctx: INavigationContext) => ReactNode;

  // ── Mega-menu featured card ─────────────────────────────────
  /**
   * ONE promotional card rendered beside the column grid on a
   * `mega-menu`-kind item. Vercel-style "featured product" tile
   * — icon puck + title + description + CTA arrow. Ignored on
   * every non-mega-menu kind. See {@link IMegaMenuFeatured}.
   */
  readonly featured?: IMegaMenuFeatured;
}

/**
 * Alias kept for compatibility with earlier reference source that
 * used `MenuTag`. Prefer `IMenuTag`.
 */
export type MenuTag = IMenuTag;
