/**
 * @file grants.zones.ts
 * @module @stackra/contracts/zones
 * @description Canonical zone identifiers owned by `@stackra/grants`.
 *
 *   Every `<Zone id="grants.*">` + every `IZoneContribution.zone`
 *   targeting a grants zone MUST import from this file per
 *   `.kiro/steering/zones-catalog.md` §Rule 1. Full injection intent
 *   lives in `.kiro/plans/zones-workspace-inventory.md` §3.
 */

/**
 * Canonical zone identifiers owned by `@stackra/grants`.
 */
export const GRANTS_ZONES = {
  /**
   * Toolbar above the grants list — filter, search, bulk revoke,
   * export.
   *
   * Emitter: `<GrantsListPage>` in
   * `packages/frontend/grants/src/react/pages/grants-list-page/`.
   * Contributions: (none as of Day One).
   * Context params: `{ tenantId?, applicationId? }`.
   */
  LIST_TOOLBAR: "grants.list.toolbar",

  /**
   * Per-row actions on the grants list.
   *
   * Emitter: `<GrantsListPage>` row-level actions.
   * Contributions: (none as of Day One).
   * Context params: `{ grant: IGrant, tenantId? }`.
   */
  LIST_ROW_ACTIONS: "grants.list.row.actions",

  /**
   * Above the scope selector on grant-create form. Slot for
   * policy hints, SLA callouts.
   *
   * Emitter: `<GrantCreatePage>`.
   * Contributions: (v1.1).
   * Context params: `{ tenantId, applicationId? }`.
   */
  CREATE_FORM_BEFORE_SCOPE: "grants.create.form.before-scope",

  /**
   * Below the scope selector on grant-create form. Slot for
   * validators, warnings, related-grant finder.
   *
   * Emitter: `<GrantCreatePage>`.
   * Contributions: (v1.1).
   * Context params: `{ tenantId, applicationId?, scope? }`.
   */
  CREATE_FORM_AFTER_SCOPE: "grants.create.form.after-scope",

  /**
   * Header action bar on the grant detail page.
   *
   * Emitter: `<GrantDetailPage>`.
   * Contributions: (v1.1 — audit-export planned).
   * Intrinsic children: `revoke`, `extend`, `delegate`.
   * Context params: `{ grantId, tenantId? }`.
   */
  DETAIL_HEADER_ACTIONS: "grants.detail.header.actions",

  /**
   * Right sidebar on the grant detail page.
   *
   * Emitter: `<GrantDetailPage>` right sidebar.
   * Contributions: (v1.1).
   * Intrinsic children: `related-grants`, `audit-trail`.
   * Context params: `{ grantId, tenantId? }`.
   */
  DETAIL_SIDEBAR: "grants.detail.sidebar",

  /**
   * Left filter sidebar on the effective-permissions page.
   *
   * Emitter: `<EffectivePermissionsPage>`.
   * Contributions: (v1.1).
   * Context params: `{ userId?, tenantId? }`.
   */
  EFFECTIVE_FILTERS: "grants.effective.filters",

  /**
   * Per-row actions on the effective-permissions result table.
   *
   * Emitter: `<EffectivePermissionsPage>` row-level actions.
   * Contributions: (v1.1).
   * Context params: `{ permission: IPermission, userId?,
   * tenantId? }`.
   */
  EFFECTIVE_RESULT_ROW_ACTIONS: "grants.effective.result.row.actions",
} as const;

/** Union of every zone identifier owned by `@stackra/grants`. */
export type GrantsZoneId = (typeof GRANTS_ZONES)[keyof typeof GRANTS_ZONES];
