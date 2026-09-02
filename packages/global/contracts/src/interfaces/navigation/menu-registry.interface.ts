/**
 * @file menu-registry.interface.ts
 * @module @stackra/contracts/interfaces/navigation
 * @description Runtime contract for `@stackra/navigation`'s menu
 *   registry. Every package that contributes menus (`primary`,
 *   `footer`, `account`, `mobile`, `help`, `command-palette`,
 *   `breadcrumb`) targets this contract via `NavigationModule.forFeature`
 *   per ADR-0052.
 *
 *   The registry is keyed by `location` (string). Each location holds
 *   an ordered list of `IMenuRegistration` records. `.resolve(location, ctx)`
 *   walks the list, evaluates each registration's `when(ctx)` predicate,
 *   applies every item-level gate (`hideOn`, `auth`, `requiresPermission`,
 *   `requiresFeature`, `when(ctx)`), sorts by `IMenuItem.order`, and
 *   returns the flattened `IMenu` a surface component renders.
 *
 *   Subscribers can listen for registry changes to re-render on
 *   contribution mutations (`.subscribe(location, listener)`).
 */

import type { IMenu } from "./menu.interface";
import type { IMenuRegistration } from "./menu-registration.interface";
import type { INavigationContext } from "./navigation-context.interface";

/**
 * Function signature for registry subscribers.
 *
 * Called when the registry's data for the subscribed location
 * mutates (register / unregister / clear).
 */
export type MenuRegistryListener = (location: string) => void;

/**
 * Return shape from `.resolve(location, ctx)` — the fully-gated,
 * ordered menu ready for rendering. Returns `null` when zero
 * registrations survive filtering.
 */
export interface IResolvedMenu {
  /** The resolved menu, ready to render. */
  readonly menu: IMenu;
  /** How many registrations contributed. Useful for diagnostics. */
  readonly registrationCount: number;
  /** How many items were filtered out by gates. */
  readonly filteredCount: number;
}

/**
 * The menu registry — one instance per DI container. Bound under
 * the `MENU_REGISTRY` token in `@stackra/contracts`.
 */
export interface IMenuRegistry {
  /**
   * Register a menu contribution at a location. Multiple packages
   * MAY register against the same location.
   */
  register(location: string, registration: IMenuRegistration): void;

  /**
   * Remove a specific menu registration by its `menu.id`.
   */
  unregister(location: string, menuId: string): void;

  /**
   */
  list(location: string): readonly IMenuRegistration[];

  /**
   * Merge every registration for a location, apply gates against
   * the supplied context, and return the resolved menu. Returns
   * `null` when no registrations pass filtering.
   */
  resolve(location: string, ctx: INavigationContext): IResolvedMenu | null;

  /**
   * Every location the registry knows about.
   */
  locations(): readonly string[];

  /**
   * Subscribe to registry changes at a specific location. Returns
   * an unsubscribe callback.
   */
  subscribe(location: string, listener: MenuRegistryListener): () => void;

  /**
   * Wipe every registration — used by tests + hot-reload boundaries.
   */
  clear(): void;
}
