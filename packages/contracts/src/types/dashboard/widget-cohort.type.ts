/**
 * @file widget-cohort.type.ts
 * @module @stackra/contracts/types/dashboard
 * @description Cohort a widget belongs to in the catalogue. Cohorts
 *   group widgets in the catalogue drawer and are surfaced as the
 *   header labels above each group.
 *
 *   Promoted from `@stackra/dashboard/core/types` on 2026-07-27
 *   alongside `IWidgetMetadata` — the decorator's parameter type
 *   references this union, so the type must live at the contracts
 *   layer to break the `@stackra/decorators` ↔ `@stackra/dashboard`
 *   dependency cycle.
 *
 *   The trailing `(string & {})` keeps the union open so downstream
 *   packages can register additional cohorts at boot without a
 *   shared type edit.
 */

/**
 * Widget cohort — the group the catalogue drawer places a widget
 * under. Human-readable labels come from `COHORT_LABELS` in
 * `@stackra/dashboard/core/constants/` (plus per-cohort labels
 * shipped by consumers).
 *
 * ## Canonical cohorts
 *
 * - `onboarding` — get-started checklists and empty-state guides
 * - `kpi` / `numbers` — single-metric cards
 * - `charts` — time-series, distributions
 * - `calendar` — sessions, matches, events on a timeline
 * - `activity` — recent-action feeds, notifications
 * - `people` — athletes, coaches, family activity
 * - `revenue` / `money` — commercial metrics
 * - `operations` — capacity, alerts, system health
 * - `compliance` — safeguarding, credentials, consents
 * - `access` — RBAC / grants / delegations / invitations / access-requests
 * - `ai` — AI-driven suggestions, token usage, recent conversations
 * - `custom` — user-authored fallback
 */
export type WidgetCohort =
  | "onboarding"
  | "kpi"
  | "numbers"
  | "charts"
  | "calendar"
  | "activity"
  | "people"
  | "revenue"
  | "money"
  | "operations"
  | "compliance"
  | "access"
  | "ai"
  | "custom"
  | (string & {});
