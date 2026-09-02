/**
 * @file sidebar-context-value.interface.ts
 * @module @stackra/contracts/interfaces/navigation
 * @description Shape of the sidebar React context. Consumers read
 *   it via `useSidebar()` from `@stackra/navigation/react`. The value
 *   is populated by `<NavSidebar>`'s internal provider and mirrors
 *   the `useSidebar` hook shipped by HeroUI Pro's `Sidebar.Provider`.
 */

/**
 * Sidebar state + controls exposed to consumers via the React
 * context published by `<NavSidebar>`.
 *
 * The shape stays deliberately close to HeroUI Pro's own
 * `useSidebar()` return type — swapping between them is a
 * pass-through.
 */
export interface ISidebarContextValue {
  /** Whether the sidebar is currently open on mobile. */
  readonly isOpen: boolean;
  /** Whether the sidebar is currently collapsed on desktop. */
  readonly isCollapsed: boolean;
  /** Whether the current viewport is mobile-scale. */
  readonly isMobile: boolean;
  /** Whether the sidebar toggle handle is currently visible. */
  readonly hasToggle: boolean;

  /** Toggle open/closed on mobile. */
  toggleOpen(): void;
  /** Toggle collapsed/expanded on desktop. */
  toggleCollapse(): void;
  /** Set the mobile-open state directly. */
  setOpen(next: boolean): void;
  /** Set the desktop-collapsed state directly. */
  setCollapsed(next: boolean): void;
}
