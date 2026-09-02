/**
 * @file sidebar-config.interface.ts
 * @module @stackra/contracts/interfaces/navigation
 * @description Configuration surface for `<NavSidebar>` — the workspace-
 *   canonical sidebar composed from HeroUI Pro's `Sidebar` primitive.
 *
 *   Every field maps 1:1 to a HeroUI Pro `Sidebar` OR `AppLayout` prop
 *   so consumers can reason about the sidebar without reading two
 *   docs. When a field maps to a prop, the mapping is called out in
 *   the field's docblock.
 *
 *   `<NavSidebar>` works two ways:
 *
 *   1. **Standalone** — `<NavSidebar location="primary" />` renders
 *      its own `Sidebar.Provider` and can sit anywhere in the tree.
 *   2. **AppLayout slot** — `<AppLayout sidebar={<NavSidebar ... />}>`;
 *      HeroUI Pro's `AppLayout` wraps its own `Sidebar.Provider`
 *      around the tree and forwards every relevant prop.
 *
 *   Prefer #2 for full-page shells (dashboard, landing) because
 *   `AppLayout` also owns the responsive scroll surface, aside, and
 *   toolbar slots.
 */

/**
 * Which side of the viewport the sidebar mounts on. `"left"` is the
 * default for LTR; `"right"` mirrors that. HeroUI Pro's `sidebarSide`
 * prop.
 */
export type SidebarSide = "left" | "right";

/**
 * Sidebar visual variant. HeroUI Pro's `sidebarVariant` prop.
 *
 * - `"sidebar"` — attached to the edge, standard shell chrome.
 * - `"floating"` — floats with a rounded panel + margin.
 * - `"inset"` — inset with a card-like border, content offset.
 */
export type SidebarVariant = "sidebar" | "floating" | "inset";

/**
 * Collapsible behaviour. HeroUI Pro's `sidebarCollapsible` prop.
 *
 * - `"icon"` — collapses to a narrow rail with icons only. Default.
 * - `"offcanvas"` — collapses fully off-canvas (recovers viewport).
 *   Required when `resizable` is enabled.
 * - `"none"` — never collapses.
 */
export type SidebarCollapsible = "icon" | "offcanvas" | "none";

/**
 * Whether the sidebar preserves its width in pixels or as a
 * percentage of the viewport when the user drags the handle.
 * HeroUI Pro's `sidebarResizeBehavior` prop.
 */
export type SidebarResizeBehavior =
  "preserve-relative-size" | "preserve-pixel-size";

/**
 * Config shape for `<NavSidebar>`. Every field is optional — sensible
 * defaults ship with the component. Pass what you want to override.
 */
export interface ISidebarConfig {
  // ── Presentation ────────────────────────────────────────────
  /** Which side the sidebar mounts on. Default `"left"`. */
  readonly side?: SidebarSide;
  /** Visual variant. Default `"sidebar"`. */
  readonly variant?: SidebarVariant;
  /** Collapsible behaviour. Default `"icon"`. */
  readonly collapsible?: SidebarCollapsible;

  // ── Initial + controlled state ──────────────────────────────
  /** Whether the sidebar starts open on mobile. Default `false`. */
  readonly defaultOpen?: boolean;
  /** Whether the sidebar starts collapsed on desktop. Default `false`. */
  readonly defaultCollapsed?: boolean;
  /**
   * Whether the sidebar's open state should persist across
   * page loads. Default `true`. When `true`, the state is stored
   * in a cookie (SSR-safe).
   */
  readonly persist?: boolean;

  // ── Keyboard ────────────────────────────────────────────────
  /**
   * Keyboard shortcut that toggles the sidebar. Default `"mod+b"`
   * (Cmd+B on macOS, Ctrl+B elsewhere). HeroUI Pro's
   * `toggleShortcut` prop.
   */
  readonly toggleShortcut?: string;

  // ── Resizable behaviour ─────────────────────────────────────
  /**
   * Whether the sidebar can be resized by dragging the handle.
   * Requires `collapsible` to be `"offcanvas"` OR `"none"`.
   * HeroUI Pro's `sidebarResizable` prop.
   */
  readonly resizable?: boolean;
  /**
   * Default width of the sidebar. Accepts a percentage (number)
   * OR a CSS size string (`"240px"`, `"16rem"`). Maps to
   * HeroUI Pro's `sidebarDefaultSize`.
   */
  readonly defaultSize?: number | string;
  /** Minimum width when resized. HeroUI Pro's `sidebarMinSize`. */
  readonly minSize?: number | string;
  /** Maximum width when resized. HeroUI Pro's `sidebarMaxSize`. */
  readonly maxSize?: number | string;
  /**
   * Resize behavior — pixels or percentage. HeroUI Pro's
   * `sidebarResizeBehavior`.
   */
  readonly resizeBehavior?: SidebarResizeBehavior;

  // ── Menu ────────────────────────────────────────────────────
  /**
   * The menu location this sidebar renders. Defaults to
   * `"primary"`.
   */
  readonly location?: string;
  /** Whether the menu shows RAC Tree-style guide lines. */
  readonly showGuideLines?: boolean | "hover";

  // ── Auto-save ───────────────────────────────────────────────
  /**
   * Localstorage key used to persist the resized width across
   * reloads. Passed straight through to HeroUI Pro's
   * `resizableAutoSaveId` prop.
   */
  readonly autoSaveId?: string;

  // ── Motion ──────────────────────────────────────────────────
  /**
   * Whether to reduce motion (respect the user's
   * `prefers-reduced-motion` preference). Default `true`.
   */
  readonly reduceMotion?: boolean;
}
