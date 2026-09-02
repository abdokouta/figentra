/**
 * @file invitations.zones.ts
 * @module @stackra/contracts/zones
 * @description Canonical zone identifiers owned by
 *   `@stackra/invitations`.
 *
 *   Every `<Zone id="invitations.*">` + every
 *   `IZoneContribution.zone` targeting an invitations zone MUST
 *   import from this file per `.kiro/steering/zones-catalog.md`
 *   §Rule 1. Full injection intent lives in
 *   `.kiro/plans/zones-workspace-inventory.md` §5.
 */

/**
 * Canonical zone identifiers owned by `@stackra/invitations`.
 */
export const INVITATIONS_ZONES = {
  /**
   * Toolbar above the invitations list — create, resend, expire.
   *
   * Emitter: `<InvitationsListPage>` in
   * `packages/frontend/invitations/src/react/pages/invitations-list-page/`.
   * Contributions: (none as of Day One).
   * Context params: `{ tenantId }`.
   */
  LIST_TOOLBAR: "invitations.list.toolbar",

  /**
   * Per-row actions on the invitations list.
   *
   * Emitter: `<InvitationsListPage>` row-level actions.
   * Contributions: (none as of Day One).
   * Context params: `{ invitation: IInvitation, tenantId }`.
   */
  LIST_ROW_ACTIONS: "invitations.list.row.actions",

  /**
   * Above the accept-invitation form. Slot for tenant info,
   * terms-of-service banner.
   *
   * Emitter: `<AcceptInvitationPage>` in
   * `packages/frontend/invitations/src/react/pages/accept-invitation-page/`.
   * Contributions: (v1.1).
   * Context params: `{ invitationToken, tenantSlug? }`.
   */
  ACCEPT_BEFORE_FORM: "invitations.accept.before-form",

  /**
   * After the name field on the accept-invitation form. Slot for
   * additional profile fields modules can add (profile-photo
   * picker, timezone, locale).
   *
   * Emitter: `<AcceptInvitationPage>`.
   * Contributions: (v1.1).
   * Context params: `{ invitationToken }`.
   */
  ACCEPT_FORM_AFTER_NAME: "invitations.accept.form.after-name",

  /**
   * Below the accept-invitation form. Footer slot — help / legal
   * / marketing consent.
   *
   * Emitter: `<AcceptInvitationPage>` footer.
   * Contributions: (v1.1).
   * Context params: `{ invitationToken }`.
   */
  ACCEPT_AFTER_FORM: "invitations.accept.after-form",
} as const;

/**
 * Union of every zone identifier owned by `@stackra/invitations`.
 */
export type InvitationsZoneId =
  (typeof INVITATIONS_ZONES)[keyof typeof INVITATIONS_ZONES];
