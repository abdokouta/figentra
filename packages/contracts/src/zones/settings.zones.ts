/**
 * @file settings.zones.ts
 * @module @stackra/contracts/zones
 * @description Canonical zone identifiers owned by `@stackra/settings`.
 *
 *   Every `<Zone id="settings.*">` + every `IZoneContribution.zone`
 *   targeting a settings zone MUST import from this file per
 *   `.kiro/steering/zones-catalog.md` §Rule 1. Full injection intent
 *   lives in `.kiro/plans/zones-workspace-inventory.md` §6.
 */

/**
 * Canonical zone identifiers owned by `@stackra/settings`.
 */
export const SETTINGS_ZONES = {
  /**
   * The primary cross-cutting settings hub slot — every workspace
   * module contributes a settings-group entry here.
   *
   * Emitter: `<SettingsHubPage>` in
   * `packages/frontend/settings/src/react/pages/settings-hub-page/`.
   * Contributions:
   * - `@stackra/rbac` — "Role management" section
   *   (id: `rbac.settings.role-management`, position: `"end"`).
   *   Wired by `WebRbacModule.forRoot(...)` per ADR-0052.
   * - `@stackra/access-requests` (v1.1) — "Access requests"
   *   section (id: `access-requests.settings.policies`).
   * - `@stackra/notifications` (v1.1) — "Notification channels"
   *   section (id: `notifications.settings.channels`).
   * - (v1.1) Every user-facing module contributes a category
   *   as it matures.
   * Intrinsic children: `tenant-name`, `tenant-branding`,
   * `security` — the built-in tenant settings.
   * Context params: `{ tenantId, applicationId? }`.
   */
  HUB_SECTIONS: "settings.hub.sections",

  /**
   * Header banner on the settings hub — tenant switcher, save
   * status, search.
   *
   * Emitter: `<SettingsHubPage>` header.
   * Contributions: (v1.1).
   * Context params: `{ tenantId }`.
   */
  HUB_HEADER: "settings.hub.header",

  /**
   * Header action bar on a settings group form page.
   *
   * Emitter: `<SettingsGroupPage>` header.
   * Contributions: (v1.1).
   * Intrinsic children: `save` (0), `cancel` (10), `reset` (20).
   * Context params: `{ groupSlug, tenantId }`.
   */
  GROUP_HEADER_ACTIONS: "settings.group.header.actions",

  /**
   * The field-list slot inside a settings-group form. Where the
   * form fields render — managed by SDUI OR by explicit
   * `<FormFieldZone>` per the `zones/design.md` §6.2 form-field
   * zone spec.
   *
   * Emitter: `<SettingsGroupPage>` field list.
   * Contributions: (v1.1 — module-specific field injections).
   * Context params: `{ groupSlug, tenantId }`.
   */
  GROUP_FIELD_LIST: "settings.group.field-list",

  /**
   * Footer slot on a settings-group form — help text, danger
   * zone, delete confirmation.
   *
   * Emitter: `<SettingsGroupPage>` footer.
   * Contributions: (v1.1).
   * Context params: `{ groupSlug, tenantId }`.
   */
  GROUP_FOOTER: "settings.group.footer",
} as const;

/** Union of every zone identifier owned by `@stackra/settings`. */
export type SettingsZoneId =
  (typeof SETTINGS_ZONES)[keyof typeof SETTINGS_ZONES];
