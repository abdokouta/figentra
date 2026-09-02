/**
 * @file index.ts
 * @module @stackra/contracts/interfaces/navigation
 * @description Barrel export for navigation interfaces.
 *
 *   Two families live in this folder:
 *
 *   1. **Menu vocabulary** — `IMenuItem`, `IMenu`, `IMenuRegistration`,
 *      `IMenuRegistry`, `IResolvedMenu`, `INavigationContext`, and the
 *      layout / breakpoint / kind enums. Consumed by every
 *      `@stackra/navigation` surface + every package that contributes
 *      menu items.
 *
 *   2. **Surface config** — `ISidebarConfig`, `IHeaderConfig`,
 *      `IFooterConfig`, `ISidebarContextValue`. Consumed by
 *      `<NavSidebar>` / `<NavHeader>` / `<NavFooter>` and the
 *      `NavigationModule.forRoot` options.
 *
 *   Web-side routing contracts stay under `../routing` (they wrap
 *   `@stackra/routing`'s own registry). React Native's navigation
 *   seam is `./native-navigation.interface.ts`.
 */

// ── Menu vocabulary ────────────────────────────────────────────
export type {
  IMenuItem,
  IMenuItemAria,
  IMenuItemBreakpointGate,
  IMenuBadge,
  IMegaMenuFeatured,
  IMenuTag,
  MenuTag,
  MenuItemKind,
  MenuAuthGate,
  MenuBadgeColor,
  MenuBannerVariant,
} from "./menu-item.interface";

export type {
  IMenu,
  IMenuColumns,
  MenuDensity,
  MenuSurface,
  MenuBackground,
  MenuBorder,
  MenuPadding,
  MenuContainerWidth,
  MenuFooterPlacement,
  IMenuDensity,
  IMenuSurface,
  IMenuBackground,
  IMenuBorder,
  IMenuPadding,
  IMenuContainerWidth,
  IMenuFooterPlacement,
} from "./menu.interface";

export type { IMenuRegistration } from "./menu-registration.interface";

export type {
  IMenuRegistry,
  IResolvedMenu,
  MenuRegistryListener,
} from "./menu-registry.interface";

export type {
  INavigationContext,
  INavigationUser,
  INavigationTenant,
  NavigationBreakpoint,
} from "./navigation-context.interface";

// ── Surface config ─────────────────────────────────────────────
export type {
  ISidebarConfig,
  SidebarSide,
  SidebarVariant,
  SidebarCollapsible,
  SidebarResizeBehavior,
} from "./sidebar-config.interface";

export type { ISidebarContextValue } from "./sidebar-context-value.interface";

export type {
  IHeaderConfig,
  HeaderPosition,
  HeaderSize,
  HeaderMaxWidth,
} from "./header-config.interface";

export type { IFooterConfig } from "./footer-config.interface";

// ── Native navigation (React Native seam) ──────────────────────
export type { INativeNavigation } from "./native-navigation.interface";
