/**
 * @file zone-contribution.interface.ts
 * @module @stackra/contracts/interfaces/zones
 * @description Tagged union describing every kind of zone
 *   contribution a package can register through
 *   `<Host>Module.forFeature({ zones: [...] })`.
 *
 *   Five interfaces live in this file per the composite-family
 *   grouping exception in `.kiro/steering/code-standards.md` §"Rule —
 *   composite family grouping for non-React shapes" — every
 *   `IZoneXContribution` is only ever consumed as one arm of the
 *   `IZoneContribution` tagged union, so grouping them together keeps
 *   the discriminated shape legible at a glance.
 *
 *   Consumers:
 *   - `IZoneRegistry.register(...)` — the DI-owned registry every
 *     `forFeature` registrar writes into. See
 *     `zone-registry.interface.ts`.
 *   - `resolveZoneOrder(...)` — the ordering algorithm in
 *     `@stackra/zones/core`.
 *   - The `<Zone>` / `<FormFieldZone>` / `<TableColumnZone>`
 *     renderers in `@stackra/zones/react` and `@stackra/zones/native`.
 */

import type { ComponentType } from "react";

import type { ISduiNode } from "../sdui/sdui-node.interface";
import type { IColumnDescriptor } from "./column-descriptor.interface";
import type { IFieldDescriptor } from "./field-descriptor.interface";
import type { IZoneContext } from "./zone-context.interface";
import type { ZonePosition } from "./zone-position.type";

/**
 * Shared fields every contribution carries — the ordering primitives
 * (`position` + `anchor` + `order`) plus the `when(ctx)` client-side
 * visibility predicate.
 *
 * Every concrete `IZoneXContribution` extends this base and adds a
 * `kind` discriminant + a payload field.
 */
export interface IZoneContributionBase {
  /**
   * Globally unique identifier — used for:
   * - de-dup at registration (last-write-wins by `id` inside a
   *   zone bucket),
   * - anchor targeting from other contributions,
   * - debugging + telemetry.
   */
  readonly id: string;

  /**
   * The dotted namespaced zone id this contribution targets, e.g.
   * `"users.list.header"`, `"customer.create.form"`. Zone ids are
   * declared by the HOST page and consumed here.
   */
  readonly zone: string;

  /**
   * Insertion position relative to `anchor`. Defaults to `"end"`
   * when omitted — the contribution appends to the tail of the zone
   * (respecting its `order`).
   */
  readonly position?: ZonePosition;

  /**
   * Intrinsic-child id (or another contribution's id) to anchor
   * against. Omit when `position` is `"start"` / `"end"`. Missing
   * anchors fall back to `"end"` and warn once per call site (per
   * design.md §5.2).
   */
  readonly anchor?: string;

  /**
   * Tiebreaker within a `(position, anchor)` bucket. Lower values
   * render first. Default `100`. Stable when equal (ES2019 sort).
   */
  readonly order?: number;

  /**
   * Optional client-side visibility predicate — reads permissions,
   * features, params, and the tenant from `ctx`. When it returns
   * `false`, the contribution is dropped from the rendered output.
   *
   * Sync only — the ordering algorithm calls this once per resolve.
   * `when(ctx)` cannot substitute for server-side authorization
   * (design.md §12); hosts that gate sensitive data MUST enforce
   * that gate on the server too.
   *
   * @param ctx - The current zone context (permissions, features,
   *   route params, tenant).
   * @returns `true` to keep the contribution; `false` to hide it.
   */
  readonly when?: (ctx: IZoneContext) => boolean;
}

/**
 * A React-component contribution — the general case.
 *
 * The component receives the resolved `IZoneContext` as its sole
 * prop and returns a React element. This is the shape used by every
 * dashboard-admin zone contribution.
 *
 * @example
 * ```tsx
 * const contribution: IZoneReactContribution = {
 *   id: "audit-recent-actions",
 *   zone: "dashboard.overview.side",
 *   kind: "react",
 *   component: RecentActionsPanel,
 * };
 * ```
 */
export interface IZoneReactContribution extends IZoneContributionBase {
  /** Discriminant — always `"react"` for this arm. */
  readonly kind: "react";

  /**
   * The React component the renderer mounts at this contribution's
   * slot. Receives `{ context }` as its sole prop.
   */
  readonly component: ComponentType<{ readonly context: IZoneContext }>;
}

/**
 * An SDUI-subtree contribution. The renderer mounts an
 * `<SduiNodeView>` around the supplied wire-format `ISduiNode`, so
 * the contribution renders through the SDUI runtime rather than as
 * a bespoke React component.
 *
 * Because `ISduiNode` is a pure wire type, this contribution shape
 * IS safe to serialize — the payload survives a JSON round-trip.
 *
 * @example
 * ```ts
 * const contribution: IZoneSduiContribution = {
 *   id: "marketing-hero-banner",
 *   zone: "landing.top",
 *   kind: "sdui",
 *   node: {
 *     id: "hero-banner",
 *     type: "Hero",
 *     props: { headline: "Welcome", subhead: "Book your session" },
 *   },
 * };
 * ```
 */
export interface IZoneSduiContribution extends IZoneContributionBase {
  /** Discriminant — always `"sdui"` for this arm. */
  readonly kind: "sdui";

  /** The SDUI wire node the renderer hands to `<SduiNodeView>`. */
  readonly node: ISduiNode;
}

/**
 * A form-field contribution — consumed by `<FormFieldZone>` hosts to
 * inject an additional field into a form the host owns.
 *
 * The payload is pure data (`IFieldDescriptor`) — safe to serialize
 * and to reason about outside of React.
 */
export interface IZoneFieldContribution extends IZoneContributionBase {
  /** Discriminant — always `"field"` for this arm. */
  readonly kind: "field";

  /** The field descriptor to insert into the form. */
  readonly field: IFieldDescriptor;
}

/**
 * A table-column contribution — consumed by `<TableColumnZone>`
 * hosts to inject an additional column into a table the host owns.
 *
 * The payload includes a React `cell` component, so this contribution
 * shape is NOT wire-safe (unlike the `field` arm). The parts that DO
 * cross the wire are the column's `id` + `header` + `width` +
 * `sortable`.
 */
export interface IZoneColumnContribution extends IZoneContributionBase {
  /** Discriminant — always `"column"` for this arm. */
  readonly kind: "column";

  /** The column descriptor to insert into the table. */
  readonly column: IColumnDescriptor;
}

/**
 * Tagged union of every zone-contribution kind — the shape stored in
 * `IZoneRegistry` and consumed by `resolveZoneOrder(...)`.
 *
 * The `kind` field is the discriminant; every consumer switches on
 * it. Adding a new arm is a MAJOR bump on `@stackra/contracts`
 * (breaking API change); adding a new optional field to an existing
 * arm is a MINOR bump (design.md §11 Wire-format guarantees).
 */
export type IZoneContribution =
  | IZoneReactContribution
  | IZoneSduiContribution
  | IZoneFieldContribution
  | IZoneColumnContribution;
