/**
 * @file notifications.zones.ts
 * @module @stackra/contracts/zones
 * @description Canonical zone identifiers owned by
 *   `@stackra/notifications`.
 *
 *   Every `<Zone id="notifications.*">` + every
 *   `IZoneContribution.zone` targeting a notifications zone MUST
 *   import from this file per `.kiro/steering/zones-catalog.md`
 *   §Rule 1. Full injection intent lives in
 *   `.kiro/plans/zones-workspace-inventory.md` §7.
 */

/**
 * Canonical zone identifiers owned by `@stackra/notifications`.
 */
export const NOTIFICATIONS_ZONES = {
  /**
   * Toolbar above the inbox — mark all read, filter, snooze all.
   *
   * Emitter: `<InboxPage>` in
   * `packages/frontend/notifications/src/react/pages/inbox-page/`.
   * Contributions: (v1.1).
   * Context params: `{ tenantId?, userId }`.
   */
  INBOX_TOOLBAR: "notifications.inbox.toolbar",

  /**
   * Per-row actions on the inbox list.
   *
   * Emitter: `<InboxPage>` row-level actions.
   * Contributions: (v1.1 — per-category action injections).
   * Context params: `{ notification: INotification, userId }`.
   */
  INBOX_ROW_ACTIONS: "notifications.inbox.row.actions",

  /**
   * Empty-state slot when the inbox has no notifications.
   *
   * Emitter: `<InboxPage>` empty state.
   * Contributions: (v1.1).
   * Context params: `{ userId }`.
   */
  INBOX_EMPTY_STATE: "notifications.inbox.empty-state",

  /**
   * The primary cross-cutting preferences slot — every workspace
   * module contributes its own preferences category row here.
   *
   * Emitter: `<NotificationPreferencesPage>` in
   * `packages/frontend/notifications/src/react/pages/notification-preferences-page/`.
   * Contributions (Day One — populated by Wave 3):
   * - `@stackra/rbac` — "Role changes" category
   *   (id: `rbac.preferences.role-changes`, position: `"end"`).
   * - `@stackra/access-requests` — "Access requests" category
   *   (id: `access-requests.preferences.requests`, position:
   *   `"end"`).
   * - `@stackra/invitations` — "Invitations" category
   *   (id: `invitations.preferences.invitations`, position:
   *   `"end"`).
   * - `@stackra/grants` — "Grants + delegations" category
   *   (id: `grants.preferences.grants`, position: `"end"`).
   * - (v1.1) Every user-facing module contributes a category.
   * Intrinsic children: `email-defaults`, `push-defaults` — the
   * built-in defaults.
   * Context params: `{ userId, tenantId? }`.
   */
  PREFERENCES_GROUPS: "notifications.preferences.groups",

  /**
   * Footer on the preferences page — global disable, timezone,
   * quiet-hours.
   *
   * Emitter: `<NotificationPreferencesPage>` footer.
   * Contributions: (v1.1).
   * Context params: `{ userId }`.
   */
  PREFERENCES_FOOTER: "notifications.preferences.footer",
} as const;

/**
 * Union of every zone identifier owned by `@stackra/notifications`.
 */
export type NotificationsZoneId =
  (typeof NOTIFICATIONS_ZONES)[keyof typeof NOTIFICATIONS_ZONES];
