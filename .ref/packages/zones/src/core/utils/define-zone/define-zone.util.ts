/**
 * @file define-zone.util.ts
 * @module @stackra/zones/core/utils/define-zone
 * @description Declarative factory for authoring zone contributions.
 *
 *   Every zone contribution the workspace ships lands as a
 *   dedicated `.zone.tsx` file whose sole export is a
 *   `defineZone(config)` result. Feature modules import that file
 *   + pass the result into `ZonesModule.forFeature({ zones: [...] })`.
 *   No inline `@Injectable() Registrar` class, no hand-rolled
 *   `{ context: IZoneContext }` adapter — this factory owns both.
 *
 *   ## What it does
 *
 *   1. **Types the input** against the four `IZoneContribution`
 *      arms (react / sdui / field / column) — so every field is
 *      autocomplete-friendly + validated at authoring time.
 *   2. **Auto-wraps `kind: "react"` components** in a stable,
 *      module-scope adapter that satisfies the zone contract's
 *      strict `ComponentType<{ context: IZoneContext }>` prop
 *      shape. Consumers pass their real component even when it
 *      accepts no props; the adapter renders it via
 *      `React.createElement` and forwards `context` as a prop
 *      (silently dropped by function components that don't declare
 *      it — no React warning).
 *   3. **Preserves component identity** for tree-shaking + React
 *      DevTools. The adapter's `displayName` mirrors the wrapped
 *      component's name (`ZoneAdapter(ThemeSwitcher)`).
 *
 *   ## What it doesn't do
 *
 *   - It does NOT register the contribution — that's
 *     `ZonesModule.forFeature({ zones: [...] })`'s job (per
 *     ADR-0052 registrar-class pattern).
 *   - It does NOT validate zone IDs against a closed set — zone
 *     ids are dotted strings owned by the emitting package.
 *   - It does NOT resolve `when(ctx)` predicates — that's the
 *     runtime concern of `resolveZoneOrder`.
 *
 *   ## Cross-references
 *
 *   - `.kiro/steering/zones-catalog.md` — zone identifier +
 *     contribution + registrar conventions.
 *   - `.kiro/steering/module-lifecycle.md` §"`forFeature`" —
 *     ADR-0052 canonical shape for the registrar class.
 */

import {
  createElement,
  type ComponentType,
  type FC,
  type ReactElement,
} from "react";

import type {
  IZoneColumnContribution,
  IZoneContext,
  IZoneContribution,
  IZoneFieldContribution,
  IZoneReactContribution,
  IZoneSduiContribution,
} from "@stackra/contracts";

/**
 * Widest component shape the factory accepts — every React
 * component satisfies `ComponentType<any>` regardless of its
 * declared prop shape. The factory wraps the input in the strict
 * `ComponentType<{ context: IZoneContext }>` adapter that the
 * zone contract actually requires.
 *
 * The `any` here is intentional + narrow: React's `ComponentType`
 * is contravariant in props, so `ComponentType<LanguageToggleProps>`
 * doesn't assign to `ComponentType<unknown>`. Using `any` at this
 * seam widens the input to accept every component regardless of
 * prop shape — the adapter bridges the difference at runtime
 * (function components silently drop unknown props, so passing
 * `{ context }` through to a component that doesn't declare it is
 * a no-op). Prop-shape correctness is the CONSUMER's concern via
 * the zone contribution's `when(ctx)` predicate + `component`
 * source of truth — not this factory's.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ZoneInputComponent = ComponentType<any>;

export type IZoneReactContributionInput = Omit<
  IZoneReactContribution,
  "component"
> & {
  /**
   * The React component the zone renders. Can be:
   *
   * - A canonical zone-aware component
   *   (`ComponentType<{ context: IZoneContext }>`) — passed through.
   * - A no-props component (`() => ReactElement`) — wrapped so
   *   the zone renderer's `context` prop is silently dropped.
   * - A component with its own prop shape (e.g., `<ThemeSwitcher>`
   *   accepting `IThemeSwitcherProps`) — wrapped identically; the
   *   zone renderer's `context` prop is silently dropped.
   */
  readonly component: ZoneInputComponent;
};

/**
 * Discriminated union of every input shape `defineZone` accepts.
 *
 * The non-react arms (`sdui`, `field`, `column`) pass through
 * unchanged — they don't render React components, so no adapter
 * is needed. The `react` arm is where the widening + adapter
 * wrapping happens.
 */
export type IZoneContributionInput =
  | IZoneReactContributionInput
  | IZoneSduiContribution
  | IZoneFieldContribution
  | IZoneColumnContribution;

/**
 * Type guard for the `react` arm — lets TypeScript narrow within
 * `defineZone`'s body.
 */
function isReactInput(
  input: IZoneContributionInput,
): input is IZoneReactContributionInput {
  return input.kind === "react";
}

/**
 * Build the module-scope adapter component that satisfies the
 * zone contract's `ComponentType<{ context: IZoneContext }>` shape.
 * Passes `context` through so context-aware components can consume
 * it; components that don't declare `context` in their props
 * silently drop it (React FC prop-passing convention).
 *
 * `displayName` mirrors the wrapped component's name so React
 * DevTools shows `ZoneAdapter(ThemeSwitcher)` etc.
 */
function buildZoneAdapter(
  Component: ZoneInputComponent,
): FC<{ readonly context: IZoneContext }> {
  const wrappedName =
    (Component as { displayName?: string }).displayName ??
    (Component as { name?: string }).name ??
    "Component";

  // Cast to the zone-aware shape so React's typed `createElement`
  // overload accepts `{ context }` as valid props. Runtime is
  // identical — function components silently ignore unknown props
  // — the cast is a compile-time affordance so `createElement`'s
  // strict prop typing lets the shim through.
  const AsZoneAware = Component as ComponentType<{
    readonly context: IZoneContext;
  }>;

  const Adapter: FC<{ readonly context: IZoneContext }> = ({
    context,
  }): ReactElement => createElement(AsZoneAware, { context });

  Adapter.displayName = `ZoneAdapter(${wrappedName})`;
  return Adapter;
}

/**
 * Declaratively author a zone contribution — the workspace-canonical
 * factory used by every `.zone.tsx` file across every framework +
 * app package.
 *
 * @param input - The contribution config. For `kind: "react"`, the
 *   `component` field is widened to accept any React component;
 *   the factory wraps it in the zone-context adapter automatically.
 * @returns A ready-to-register `IZoneContribution`.
 *
 * @example Compact toggle contribution to the header
 * ```tsx
 * // packages/frontend/i18n/src/react/zones/language-toggle-header.zone.tsx
 * import { NAVIGATION_ZONES } from "@stackra/contracts";
 * import { defineZone } from "@stackra/zones";
 * import { LanguageToggle } from "../components/language-toggle";
 *
 * export const languageToggleHeaderZone = defineZone({
 *   id: "i18n.header.language-toggle",
 *   zone: NAVIGATION_ZONES.HEADER_END,
 *   kind: "react",
 *   position: "start",
 *   order: 110,
 *   component: LanguageToggle,
 * });
 * ```
 *
 * @example SDUI-schema contribution (no adapter needed)
 * ```ts
 * export const marketingBannerZone = defineZone({
 *   id: "landing.hero.top-banner",
 *   zone: "landing.top",
 *   kind: "sdui",
 *   node: { id: "hero-banner", type: "PromoBanner", props: { ... } },
 * });
 * ```
 */
export function defineZone(input: IZoneContributionInput): IZoneContribution {
  if (isReactInput(input)) {
    const { component, ...rest } = input;
    const adapter = buildZoneAdapter(component);
    return { ...rest, kind: "react", component: adapter };
  }
  // Non-react arms pass through — the wire format IS the contract.
  return input;
}
