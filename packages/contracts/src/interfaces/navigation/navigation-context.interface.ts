/**
 * @file navigation-context.interface.ts
 * @module @stackra/contracts/interfaces/navigation
 * @description The runtime context every menu-item gate reads.
 *
 *   Assembled by `<NavigationProvider>` (or the framework auto-
 *   assembles it from injected services) and passed to every
 *   `IMenuItem.when(ctx)` predicate + every `<Zone>` contribution.
 *
 *   Keep every field READONLY — contributions must never mutate the
 *   context. Immutability lets the renderer memoise the entire tree
 *   per context revision.
 */

/**
 * The active viewport breakpoint. Consumers of `<NavItem>` use this
 * alongside `IMenuItem.hideOn` to suppress rendering on unwanted
 * screen sizes.
 */
export type NavigationBreakpoint = "mobile" | "tablet" | "desktop";

/**
 * Minimal user representation the navigation surface needs.
 *
 * The shape is intentionally narrow — the navigation package does
 * NOT own an `IUser` interface (that lives in `@stackra/auth-ui`).
 * Consumers project their user record into this shape when
 * mounting `<NavigationProvider>`.
 */
export interface INavigationUser {
  readonly id: string;
  readonly displayName?: string;
  readonly email?: string;
  readonly avatarUrl?: string;
  readonly initials?: string;
}

/**
 * Minimal tenant representation the navigation surface needs.
 */
export interface INavigationTenant {
  readonly id: string;
  readonly slug?: string;
  readonly displayName?: string;
  readonly logoUrl?: string;
}

/**
 * The runtime context every gate + contribution reads.
 *
 * @example
 * ```typescript
 * const ctx: INavigationContext = {
 *   authenticated: true,
 *   permissions: ["rbac.roles.view", "grants.list"],
 *   features: ["billing.v2"],
 *   breakpoint: "desktop",
 *   currentPath: "/rbac/roles/123",
 *   tenant: { id: "t_abc", slug: "acme" },
 *   user: { id: "u_xyz", displayName: "Ada Lovelace" },
 * };
 * ```
 */
export interface INavigationContext {
  /** Whether the caller is signed in. */
  readonly authenticated: boolean;
  /** Permission strings the caller holds. */
  readonly permissions: readonly string[];
  /** Feature-flag keys enabled for the caller. */
  readonly features: readonly string[];
  /** Active viewport breakpoint. */
  readonly breakpoint: NavigationBreakpoint;
  /** Current pathname — used for `isCurrent` highlighting. */
  readonly currentPath: string;
  /** Active tenant, when the caller is inside one. */
  readonly tenant?: INavigationTenant;
  /** Active user record, when authenticated. */
  readonly user?: INavigationUser;
  /** Locale (BCP-47) — for RTL / bidi decisions. */
  readonly locale?: string;
  /** Whether the layout is RTL. Default `false`. */
  readonly isRtl?: boolean;
  /** Arbitrary caller-supplied context slot. */
  readonly extra?: Record<string, unknown>;
}
