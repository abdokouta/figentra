/**
 * @file zone-context.interface.ts
 * @module @stackra/contracts/interfaces/zones
 * @description Runtime context passed to every zone contribution — the
 *   permissions + features + params + tenant surface the host page has
 *   resolved when it renders a `<Zone>` (or its `<FormFieldZone>` /
 *   `<TableColumnZone>` cousins).
 *
 *   Consumers of this context:
 *   - `IZoneContributionBase.when(ctx)` — the client-side visibility
 *     predicate every contribution may declare. See
 *     `zone-contribution.interface.ts`.
 *   - The `component` in `IZoneReactContribution` — receives `context`
 *     as its sole prop.
 *   - The `column.cell` in `IZoneColumnContribution` — receives
 *     `context` alongside the row it renders.
 *   - `resolveZoneOrder(intrinsic, contributions, ctx)` in
 *     `@stackra/zones/core` — the pure ordering algorithm.
 *
 *   `when(ctx)` is CLIENT-SIDE filtering only — it never enforces
 *   server-side authorization (design.md §12 Security). Hosts that
 *   gate sensitive data MUST also gate on the server; `when` is a
 *   UI-level visibility switch.
 */

/**
 * Runtime scope every zone contribution can read at render time.
 *
 * Every field is `readonly` — contributions treat the context as an
 * observation of the current app state, not as mutable input.
 *
 * @example
 * ```ts
 * const contribution: IZoneReactContribution = {
 *   id: "audit-users-header-badge",
 *   zone: "users.list.header",
 *   kind: "react",
 *   position: "end",
 *   when: (ctx) =>
 *     ctx.permissions.includes("audit.view") &&
 *     ctx.features.includes("audit_extended"),
 *   component: AuditBadge,
 * };
 * ```
 */
export interface IZoneContext {
  /**
   * The zone id being resolved — the dotted string handed to
   * `<Zone id={...}>` at the host page. Useful for logging +
   * telemetry inside `when(ctx)` and for a contribution's component
   * to know which zone hosted it.
   */
  readonly zoneId: string;

  /**
   * Permissions the current user holds — sourced from the RBAC
   * subsystem (`AUTHORIZATION_MANAGER`) when wired; empty array
   * otherwise. The zones runtime resolves this via
   * `useOptionalInject` so the system runs stand-alone in headless
   * tests without RBAC installed.
   */
  readonly permissions: readonly string[];

  /**
   * Feature keys the current tenant has entitled — sourced from
   * `FEATURE_FLAGS_MANAGER` when wired; empty array otherwise.
   */
  readonly features: readonly string[];

  /**
   * Route params merged from the enclosing host route + any extra
   * `params` prop passed to `<Zone params={...}>`. Read-only view of
   * the URL / navigation state at render time.
   */
  readonly params: Readonly<Record<string, unknown>>;

  /**
   * Tenant record (id, slug, capabilities). Optional — SDUI screens
   * can render without a resolved tenant on marketing surfaces. The
   * zones runtime resolves this via `useOptionalInject(TENANCY_CONTEXT)`
   * so the context object may legitimately omit the tenant.
   */
  readonly tenant?: Readonly<Record<string, unknown>>;
}
