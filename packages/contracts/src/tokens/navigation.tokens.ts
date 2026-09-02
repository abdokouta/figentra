/**
 * @file navigation.tokens.ts
 * @module @stackra/contracts/tokens
 * @description DI tokens for the `@stackra/navigation` runtime.
 *
 *   Every token uses `Symbol.for(...)` so identity is observed
 *   across module realms (HMR reload, code-split chunk, test-only
 *   duplicates).
 */

/** DI token for the merged `INavigationModuleOptions`. */
export const NAVIGATION_CONFIG = "navigation" as const;

/**
 * DI token for the `IMenuRegistry` — the workspace-canonical
 * registry every package contributes menu items through.
 *
 * Bound in `NavigationModule.forRoot()`. Consumers inject via
 * `@Inject(MENU_REGISTRY)` OR read from React via
 * `useMenuRegistry()`.
 */
export const MENU_REGISTRY = Symbol.for("@stackra/navigation/MENU_REGISTRY");

/**
 * DI token for the `INavigationContext` provider. Reads the
 * caller's auth state, permissions, features, breakpoint, and
 * pathname; every menu gate + zone contribution consumes it.
 */
export const NAVIGATION_CONTEXT_SERVICE = Symbol.for(
  "@stackra/navigation/NAVIGATION_CONTEXT_SERVICE",
);

/**
 * DI token for the `<NavIcon>` resolver — maps a string icon key
 * to a React node. Consumers register their icon set at boot.
 */
export const NAVIGATION_ICON_RESOLVER = Symbol.for(
  "@stackra/navigation/NAVIGATION_ICON_RESOLVER",
);
