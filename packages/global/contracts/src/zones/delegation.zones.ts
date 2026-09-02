/**
 * @file delegation.zones.ts
 * @module @stackra/contracts/zones
 * @description Canonical zone identifiers owned by
 *   `@stackra/delegation`.
 *
 *   Every `<Zone id="delegation.*">` + every
 *   `IZoneContribution.zone` targeting a delegation zone MUST
 *   import from this file per `.kiro/steering/zones-catalog.md`
 *   §Rule 1. Full injection intent lives in
 *   `.kiro/plans/zones-workspace-inventory.md` §8.
 */

/**
 * Canonical zone identifiers owned by `@stackra/delegation`.
 */
export const DELEGATION_ZONES = {
  /**
   * Toolbar above the personal-delegations list.
   *
   * Emitter: `<PersonalDelegationsPage>` in
   * `packages/frontend/delegation/src/react/pages/personal-delegations-page/`.
   * Contributions: (v1.1).
   * Context params: `{ userId }`.
   */
  PERSONAL_LIST_TOOLBAR: "delegation.personal.list.toolbar",

  /**
   * Per-row actions on the personal-delegations list — revoke,
   * extend.
   *
   * Emitter: `<PersonalDelegationsPage>` row-level actions.
   * Contributions: (none as of Day One).
   * Context params: `{ delegation: IDelegation, userId }`.
   */
  PERSONAL_LIST_ROW_ACTIONS: "delegation.personal.list.row.actions",

  /**
   * Toolbar above the admin-delegations page — filter by
   * delegator / delegate.
   *
   * Emitter: `<AdminDelegationsPage>` in
   * `packages/frontend/delegation/src/react/pages/admin-delegations-page/`.
   * Contributions: (v1.1).
   * Context params: `{ tenantId? }`.
   */
  ADMIN_LIST_TOOLBAR: "delegation.admin.list.toolbar",

  /**
   * Per-row actions on the admin-delegations list.
   *
   * Emitter: `<AdminDelegationsPage>` row-level actions.
   * Contributions: (none as of Day One).
   * Context params: `{ delegation: IDelegation, tenantId? }`.
   */
  ADMIN_LIST_ROW_ACTIONS: "delegation.admin.list.row.actions",
} as const;

/** Union of every zone identifier owned by `@stackra/delegation`. */
export type DelegationZoneId =
  (typeof DELEGATION_ZONES)[keyof typeof DELEGATION_ZONES];
