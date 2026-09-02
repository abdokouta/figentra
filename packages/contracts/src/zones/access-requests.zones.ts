/**
 * @file access-requests.zones.ts
 * @module @stackra/contracts/zones
 * @description Canonical zone identifiers owned by
 *   `@stackra/access-requests`.
 *
 *   Every `<Zone id="access-requests.*">` + every
 *   `IZoneContribution.zone` targeting an access-requests zone MUST
 *   import from this file per `.kiro/steering/zones-catalog.md`
 *   §Rule 1. Full injection intent lives in
 *   `.kiro/plans/zones-workspace-inventory.md` §2.
 */

/**
 * Canonical zone identifiers owned by `@stackra/access-requests`.
 */
export const ACCESS_REQUESTS_ZONES = {
  /**
   * Toolbar above the approvers inbox — bulk approve/deny,
   * filters, export.
   *
   * Emitter: `<ApproversInboxPage>` in
   * `packages/frontend/access-requests/src/react/pages/approvers-inbox-page/`.
   * Contributions: (none as of Day One).
   * Context params: `{ approverId, tenantId? }`.
   */
  APPROVERS_INBOX_TOOLBAR: "access-requests.approvers.inbox.toolbar",

  /**
   * Per-row actions on the approvers inbox.
   *
   * Emitter: `<ApproversInboxPage>` row-level actions.
   * Contributions: (none as of Day One).
   * Context params: `{ request: IAccessRequest, approverId }`.
   */
  APPROVERS_INBOX_ROW_ACTIONS: "access-requests.approvers.inbox.row.actions",

  /**
   * Empty state on the approvers inbox.
   *
   * Emitter: `<ApproversInboxPage>` empty state.
   * Contributions: (v1.1).
   * Context params: `{ approverId }`.
   */
  APPROVERS_INBOX_EMPTY_STATE: "access-requests.approvers.inbox.empty-state",

  /**
   * Header action bar on the request detail page.
   *
   * Emitter: `<RequestDetailPage>`.
   * Contributions: (v1.1 — audit-export planned).
   * Intrinsic children: `approve`, `deny`, `delegate`, `comment`.
   * Context params: `{ requestId, approverId }`.
   */
  DETAIL_HEADER_ACTIONS: "access-requests.detail.header.actions",

  /**
   * Tab bar on the request detail page.
   *
   * Emitter: `<RequestDetailPage>` tab bar.
   * Contributions: (v1.1).
   * Context params: `{ requestId }`.
   */
  DETAIL_TABS: "access-requests.detail.tabs",

  /**
   * Right sidebar on the request detail page — requester profile,
   * permission preview, similar-request finder.
   *
   * Emitter: `<RequestDetailPage>` right sidebar.
   * Contributions: (v1.1).
   * Intrinsic children: `requester-profile`, `permission-preview`.
   * Context params: `{ requestId, requesterId }`.
   */
  DETAIL_SIDEBAR: "access-requests.detail.sidebar",

  /**
   * Above the reason field on the submit-request form.
   *
   * Emitter: `<SubmitRequestPage>`.
   * Contributions: (v1.1 — policy-banner injections).
   * Context params: `{ tenantId, applicationId? }`.
   */
  SUBMIT_FORM_BEFORE_REASON: "access-requests.submit.form.before-reason",

  /**
   * Below the reason field on the submit-request form.
   *
   * Emitter: `<SubmitRequestPage>`.
   * Contributions: (v1.1 — attachments + context injections).
   * Context params: `{ tenantId, applicationId? }`.
   */
  SUBMIT_FORM_AFTER_REASON: "access-requests.submit.form.after-reason",

  /**
   * Toolbar above the my-requests list.
   *
   * Emitter: `<MyRequestsPage>`.
   * Contributions: (v1.1).
   * Context params: `{ userId }`.
   */
  MY_REQUESTS_LIST_TOOLBAR: "access-requests.my-requests.list.toolbar",

  /**
   * Per-row actions on the my-requests list.
   *
   * Emitter: `<MyRequestsPage>` row-level actions.
   * Contributions: (v1.1).
   * Context params: `{ request: IAccessRequest, userId }`.
   */
  MY_REQUESTS_LIST_ROW_ACTIONS: "access-requests.my-requests.list.row.actions",

  /**
   * Toolbar above the admin-list page.
   *
   * Emitter: `<AdminListPage>`.
   * Contributions: (v1.1).
   * Context params: `{ tenantId? }`.
   */
  ADMIN_LIST_TOOLBAR: "access-requests.admin.list.toolbar",

  /**
   * Per-row actions on the admin-list page.
   *
   * Emitter: `<AdminListPage>` row-level actions.
   * Contributions: (v1.1).
   * Context params: `{ request: IAccessRequest, tenantId? }`.
   */
  ADMIN_LIST_ROW_ACTIONS: "access-requests.admin.list.row.actions",
} as const;

/**
 * Union of every zone identifier owned by `@stackra/access-requests`.
 */
export type AccessRequestsZoneId =
  (typeof ACCESS_REQUESTS_ZONES)[keyof typeof ACCESS_REQUESTS_ZONES];
