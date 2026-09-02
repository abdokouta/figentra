/**
 * @file widget-metadata.interface.ts
 * @module @stackra/contracts/interfaces/dashboard
 * @description Shape stamped on a class by the `@Widget()` decorator.
 *
 *   Promoted from `@stackra/dashboard/core/interfaces` on 2026-07-27
 *   per `.kiro/steering/contracts-and-decorators-promotion.md` Test A —
 *   three consumers (`@stackra/notifications` × 2, `@stackra/rbac`) cross
 *   the multi-consumer threshold. The `WidgetLoader` reads this back
 *   via `@vivtel/metadata` during discovery and hands it to
 *   `WidgetCatalogueService.registerWidget(...)` to build the runtime
 *   widget entry.
 *
 *   `IWidgetMetadata` is intentionally identical in shape to the
 *   `IWidgetEntry` runtime type inside `@stackra/dashboard` — the
 *   decorator input IS the catalogue entry without transformation.
 *   Keeping the two interfaces separate documents intent (decorator
 *   input vs. registry value) and leaves room for the two shapes to
 *   diverge later.
 */

import type { WidgetCohort } from "../../types/dashboard/widget-cohort.type";
import type { WidgetPreviewType } from "../../types/dashboard/widget-preview-type.type";
import type { WidgetSpan } from "../../types/dashboard/widget-span.type";

/**
 * Metadata a `@Widget()`-decorated class carries.
 *
 * @example
 * ```typescript
 * import { BaseWidget } from "@stackra/dashboard";
 * import { Widget } from "@stackra/decorators/dashboard";
 *
 * @Widget({
 *   key: "kpi-athletes",
 *   cohort: "numbers",
 *   title: "Athletes",
 *   description: "Total active athletes across every branch.",
 *   icon: "person",
 *   span: "third",
 *   preview: "kpi",
 *   defaultEnabled: true,
 *   permission: "athletes.view",
 * })
 * export class KpiAthletesWidget extends BaseWidget {
 *   public render(): ReactNode { return <KpiCard /> }
 * }
 * ```
 */
export interface IWidgetMetadata {
  /** Stable, kebab-case identifier used in layouts + the picker. */
  key: string;

  /** Cohort bucket the widget belongs to. */
  cohort: WidgetCohort;

  /** Fallback English title — the renderer may translate. */
  title: string;

  /** One-line description shown in the picker. */
  description: string;

  /** Iconify token from the shared icon set. */
  icon: string;

  /** Width hint used by the auto-layout engine. */
  span: WidgetSpan;

  /** When `true`, the widget is enabled by default on a new user's layout. */
  defaultEnabled?: boolean;

  /**
   * Optional permission gate. The catalogue drawer hides gated
   * widgets from users who don't hold the permission;
   * `DashboardService.hasPermission()` runs the check at render
   * time so a stale saved layout can't leak data past a permission
   * revoke.
   */
  permission?: string;

  /**
   * Optional preview illustration key used by the catalogue drawer
   * card. Feature packages that ship widgets pick the illustration
   * matching their body shape (`kpi`, `bar`, `line`, `pie`, `list`,
   * `radar`, ...). Missing → the drawer falls back to `"list"`.
   */
  preview?: WidgetPreviewType;
}
