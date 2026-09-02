/**
 * @file index.ts
 * @module @stackra/contracts/zones
 * @description Barrel export for every zone-identifier constant
 *   shipped by contracts.
 *
 *   Zone constants live in `@stackra/contracts` (not the owning
 *   package's `core/`) so cross-package injection doesn't force a
 *   peer-dep on the owner. Every injecting package imports the
 *   constant from contracts — the same package it already imports
 *   `ZONE_REGISTRY`, `IZoneRegistry`, `IZoneContribution`,
 *   `IZoneContext`, `ZonePosition` from.
 *
 *   Mirrors the events pattern (`contracts/src/events/`) — one
 *   `<pkg>.zones.ts` per UI-shipping package, all re-exported here.
 *
 *   See `.kiro/steering/zones-catalog.md` for the convention +
 *   `.kiro/plans/zones-workspace-inventory.md` for the full
 *   per-package catalog + cross-package injection graph.
 */

export {
  ACCESS_REQUESTS_ZONES,
  type AccessRequestsZoneId,
} from "./access-requests.zones";
export { AUTH_UI_ZONES, type AuthUiZoneId } from "./auth-ui.zones";
export { DASHBOARD_ZONES, type DashboardZoneId } from "./dashboard.zones";
export { DELEGATION_ZONES, type DelegationZoneId } from "./delegation.zones";
export { GRANTS_ZONES, type GrantsZoneId } from "./grants.zones";
export { INVITATIONS_ZONES, type InvitationsZoneId } from "./invitations.zones";
export { NAVIGATION_ZONES, type NavigationZoneId } from "./navigation.zones";
export {
  NOTIFICATIONS_ZONES,
  type NotificationsZoneId,
} from "./notifications.zones";
export { RBAC_ZONES, type RbacZoneId } from "./rbac.zones";
export { SETTINGS_ZONES, type SettingsZoneId } from "./settings.zones";
