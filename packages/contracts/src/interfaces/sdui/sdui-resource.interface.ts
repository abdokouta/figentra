/**
 * @file sdui-resource.interface.ts
 * @module @stackra/contracts/interfaces/sdui
 * @description Wire-visible shape of ONE resource in the SDUI
 *   resource catalogue. Backend `stackra/sdui` package's
 *   `ResourceData` DTO serialises to this shape 1:1 (snake_case
 *   properties matching the wire).
 */

/**
 * One resource entry in the platform-admin SDUI catalogue.
 *
 * Returned by `GET /api/v1/platform/schema` inside the
 * `resources` array of the envelope. Consumed by the dashboard's
 * sidebar renderer to build the nav tree grouped by
 * `section` → `group` → `order`.
 */
export interface ISduiResource {
  /** Unique dotted slug (e.g. `notifications.notifications`). */
  readonly name: string;

  /** Display label. May be tenant-terminology-overridden server-side. */
  readonly label: string;

  /** Icon name — the FE maps to an icon component. */
  readonly icon: string;

  /** Nav group (e.g. `Operations`). */
  readonly group: string;

  /** Nav section (e.g. `Platform`). */
  readonly section: string;

  /** Sort order within the group. Lower is first. */
  readonly order: number;

  /** Absolute API path for this resource's CRUD scenes. */
  readonly endpoint: string;

  /** Permission slug required to see this entry AND enter its scene. */
  readonly permission: string;
}
