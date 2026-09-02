/**
 * @file dashboard.zones.ts
 * @module @stackra/contracts/zones
 * @description Canonical zone identifiers owned by
 *   `@stackra/dashboard`.
 *
 *   Every `<Zone id="dashboard.*">` + every `IZoneContribution.zone`
 *   targeting a dashboard zone MUST import from this file per
 *   `.kiro/steering/zones-catalog.md` §Rule 1. Full injection intent
 *   lives in `.kiro/plans/zones-workspace-inventory.md` §1.
 *
 *   Widget contributions are the specialised zone shape shipped by
 *   `DashboardModule.forFeature({ widgets })` per
 *   `.kiro/steering/dashboard-widgets.md` — the general-purpose
 *   `<Zone>` slots below cover the rest of the extension surface.
 */

/**
 * Canonical zone identifiers owned by `@stackra/dashboard`.
 */
export const DASHBOARD_ZONES = {
  /**
   * The widget slot on the dashboard home page — the workspace's
   * primary widget-contribution point. Already ships via
   * `DashboardModule.forFeature({ widgets })` per
   * `dashboard-widgets.md`.
   *
   * Emitter: `<DashboardHomePage>`.
   * Contributions: 15 packages already scaffold `widgets: []` per
   * the "Accepted exception — empty widget-scaffold `forFeature`"
   * rule in `subpath-layering.md`.
   * Context params: `{ tenantId, applicationId? }`.
   */
  HOME_WIDGETS: "dashboard.home.widgets",

  /**
   * Header action bar above the widget grid — export/share,
   * new-dashboard, template picker, layout controls.
   *
   * Emitter: `<DashboardHomePage>` header.
   * Contributions: (none as of Day One).
   * Context params: `{ tenantId, applicationId? }`.
   */
  HOME_HEADER_ACTIONS: "dashboard.home.header.actions",

  /**
   * Empty-state slot when zero widgets are enabled.
   *
   * Emitter: `<DashboardHomePage>` empty state.
   * Contributions: (v1.1 — onboarding CTAs, starter recommendations).
   * Context params: `{ tenantId }`.
   */
  HOME_EMPTY_STATE: "dashboard.home.empty-state",

  /**
   * Header action bar on a specific dashboard detail page.
   *
   * Emitter: `<DashboardDetailPage>`.
   * Contributions: (v1.1 — governance modules add audit / policy).
   * Intrinsic children: `save`, `share`, `present`, `embed`,
   * `delete`.
   * Context params: `{ dashboardId, tenantId }`.
   */
  DETAIL_HEADER_ACTIONS: "dashboard.detail.header.actions",

  /**
   * Advanced tabs on the dashboard detail page — permissions,
   * embed settings, alerts, revision history.
   *
   * Emitter: `<DashboardDetailPage>` tabs.
   * Contributions: (v1.1).
   * Context params: `{ dashboardId }`.
   */
  DETAIL_TABS: "dashboard.detail.tabs",

  /**
   * Per-widget editor slot on the dashboard detail page.
   *
   * Emitter: `<DashboardDetailPage>` when a widget is being
   * edited. Each widget kind contributes its editor form here.
   * Contributions: (v1.1).
   * Context params: `{ dashboardId, widgetId, widgetKind }`.
   */
  DETAIL_WIDGET_EDITOR: "dashboard.detail.widget.editor",

  /**
   * Fullscreen presentation-mode header.
   *
   * Emitter: `<DashboardPresentPage>`.
   * Contributions: (v1.1 — timer, audience-view, comments).
   * Context params: `{ dashboardId }`.
   */
  PRESENT_HEADER: "dashboard.present.header",
} as const;

/** Union of every zone identifier owned by `@stackra/dashboard`. */
export type DashboardZoneId =
  (typeof DASHBOARD_ZONES)[keyof typeof DASHBOARD_ZONES];
