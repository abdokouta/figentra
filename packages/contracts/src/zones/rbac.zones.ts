/**
 * @file rbac.zones.ts
 * @module @stackra/contracts/zones
 * @description Canonical zone identifiers owned by `@stackra/rbac`.
 *
 *   Every `<Zone id="rbac.*">` rendered by the package + every
 *   `IZoneContribution.zone` field that targets an rbac zone MUST
 *   import from this file. Raw string literals at call sites are a
 *   review-blocking finding per
 *   `.kiro/steering/zones-catalog.md` §Rule 1.
 *
 *   Discovery docblocks below name every emitter + every current
 *   contribution per zones-catalog.md §Rule 6. Full injection intent
 *   lives in `.kiro/plans/zones-workspace-inventory.md` §4.
 */

/**
 * Canonical zone identifiers owned by `@stackra/rbac`.
 */
export const RBAC_ZONES = {
  /**
   * Toolbar above the roles list — filters, search, create.
   *
   * Emitter: `<RolesListPage>` in
   * `packages/frontend/rbac/src/react/pages/roles-list-page/`.
   * Contributions: (none as of Day One).
   * Context params: `{ tenantId?, applicationId? }`.
   */
  ROLES_LIST_TOOLBAR: "rbac.roles.list.toolbar",

  /**
   * Per-row actions on the roles list — edit / duplicate / delete.
   *
   * Emitter: `<RolesListPage>` row-level actions.
   * Contributions: (none as of Day One). Governance modules
   * inject here in v1.1+ (e.g. grants-quick-view).
   * Context params: `{ role: IRole, tenantId?, applicationId? }`.
   */
  ROLES_LIST_ROW_ACTIONS: "rbac.roles.list.row.actions",

  /**
   * Header action bar on the role detail page.
   *
   * Emitter: `<RoleDetailPage>` in
   * `packages/frontend/rbac/src/react/pages/role-detail-page/`.
   * Contributions: (none as of Day One). `@stackra/audit` plans
   * "Audit trail export" in v1.1.
   * Intrinsic children: `edit` (order 0), `duplicate` (10),
   * `delete` (20).
   * Context params: `{ roleId, applicationId? }`.
   */
  ROLE_DETAIL_HEADER_ACTIONS: "rbac.role.detail.header.actions",

  /**
   * Right-hand sidebar on the role detail page — the workspace's
   * primary cross-package zone slot.
   *
   * Emitter: `<RoleDetailPage>` right sidebar.
   * Contributions (Day One — populated by Wave 3):
   * - `@stackra/grants` — "Grants carrying this role"
   *   (id: `grants.role-detail.grants-carrying`,
   *   position: `"start"`).
   * - `@stackra/delegation` — "Delegations of this role"
   *   (id: `delegation.role-detail.delegations`,
   *   position: `"after"`, anchor:
   *   `grants.role-detail.grants-carrying`).
   * - `@stackra/access-requests` — "Pending requests targeting
   *   this role" (id:
   *   `access-requests.role-detail.pending`,
   *   position: `"end"`).
   * Intrinsic children: `audit-trail` (audit-log panel),
   * `usage-stats` (users/tokens count).
   * Context params: `{ roleId, applicationId? }`.
   */
  ROLE_DETAIL_SIDEBAR: "rbac.role.detail.sidebar",

  /**
   * Tab bar on the role detail page — permissions, audit, usage.
   *
   * Emitter: `<RoleDetailPage>` tab bar.
   * Contributions: (v1.1 — governance modules add tabs).
   * Context params: `{ roleId, applicationId? }`.
   */
  ROLE_DETAIL_TABS: "rbac.role.detail.tabs",

  /**
   * Toolbar above the permissions catalog.
   *
   * Emitter: `<PermissionsCatalogPage>`.
   * Contributions: (v1.1).
   * Context params: `{ applicationId? }`.
   */
  PERMISSIONS_CATALOG_TOOLBAR: "rbac.permissions.catalog.toolbar",

  /**
   * Left filter sidebar on the permissions catalog.
   *
   * Emitter: `<PermissionsCatalogPage>`.
   * Contributions: (v1.1).
   * Context params: `{ applicationId? }`.
   */
  PERMISSIONS_CATALOG_FILTER_SIDEBAR: "rbac.permissions.catalog.filter-sidebar",
} as const;

/** Union of every zone identifier owned by `@stackra/rbac`. */
export type RbacZoneId = (typeof RBAC_ZONES)[keyof typeof RBAC_ZONES];
