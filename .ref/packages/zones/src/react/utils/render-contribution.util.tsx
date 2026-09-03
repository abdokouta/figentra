/**
 * @file render-contribution.util.tsx
 * @module @stackra/zones/react/utils
 * @description `renderContribution(contribution, context)` — pick
 *   the right rendering path per contribution `kind`. Consumed by
 *   `<Zone>` when it walks the output of `resolveZoneOrder(...)`.
 *
 *   Rendering paths:
 *
 *   - `"react"` — mount the contribution's `component` with
 *     `{ context }` as its sole prop.
 *   - `"sdui"` — render the contribution's `node` through the
 *     SDUI runtime. `@stackra/sdui` is an OPTIONAL peer — when
 *     the peer isn't installed, the SDUI arm is a no-op renderer
 *     that logs once and returns `null` so the app doesn't crash.
 *   - `"field"` / `"column"` — return `null` and warn once. Those
 *     contribution kinds are only meaningful inside
 *     `<FormFieldZone>` / `<TableColumnZone>` (respectively);
 *     seeing them here means the caller registered a field /
 *     column contribution against a general `<Zone>` — a
 *     configuration mistake the design.md §6.2 note explicitly
 *     documents.
 */

import { createElement, type ReactElement } from "react";

import type { IZoneContext, IZoneContribution } from "@stackra/contracts";

// ════════════════════════════════════════════════════════════════════
// SDUI-optional resolver
// ════════════════════════════════════════════════════════════════════

/**
 * Structural shape of the `<SduiNodeView>` prop we call — kept
 * intentionally narrow so the local dynamic-require path can hand
 * back a stub without the whole SDUI peer being resolvable.
 */
type SduiNodeViewComponent =
  | ((props: { readonly node: unknown }) => ReactElement | null)
  | { readonly type: string };

/**
 * Cached SDUI runtime lookup — resolved once per session, memoised
 * across every render. `null` when the SDUI peer isn't installed.
 */
let cachedSduiNodeView: SduiNodeViewComponent | null | undefined;

/**
 * Attempt to resolve `<SduiNodeView>` from `@stackra/sdui/react` at
 * runtime. Wrapped in `try/catch` so the missing-peer path is
 * fail-soft. `require` is used behind an `eval` shim so bundlers
 * that resolve the import statically don't fail the build when
 * `@stackra/sdui` isn't installed — the string identifier prevents
 * the bundler from following the reference.
 */
function resolveSduiNodeView(): SduiNodeViewComponent | null {
  if (cachedSduiNodeView !== undefined) return cachedSduiNodeView;
  try {
    // Runtime resolution — bundlers see a string, not a static
    // import. This preserves the optional-peer contract: consumers
    // who never render an SDUI contribution never need
    // `@stackra/sdui` installed.

    const mod = (0, eval)("require")("@stackra/sdui/react") as {
      readonly SduiNodeView?: SduiNodeViewComponent;
    };
    cachedSduiNodeView = mod?.SduiNodeView ?? null;
  } catch {
    cachedSduiNodeView = null;
  }
  return cachedSduiNodeView;
}

/**
 * Reset the SDUI resolver cache — test-only helper.
 */
export function __resetSduiNodeViewCache(): void {
  cachedSduiNodeView = undefined;
}

// ════════════════════════════════════════════════════════════════════
// Warn-once for out-of-place `field` / `column` contributions
// ════════════════════════════════════════════════════════════════════

const WARNED_KEYS = new Set<string>();

function warnOnce(key: string, message: string): void {
  if (WARNED_KEYS.has(key)) return;
  WARNED_KEYS.add(key);

  console.warn(`[@stackra/zones] ${message}`);
}

/**
 * Reset the warn-once registry — test-only helper.
 */
export function __resetRenderContributionWarnings(): void {
  WARNED_KEYS.clear();
}

// ════════════════════════════════════════════════════════════════════
// Public entry point
// ════════════════════════════════════════════════════════════════════

/**
 * Render one contribution — pick the right path per `kind`.
 *
 * @param contribution - The contribution to render.
 * @param context - The zone context — passed to `"react"`
 *   contributions as their sole prop.
 * @returns The React element to mount, or `null` when the
 *   contribution kind isn't renderable at a general `<Zone>`
 *   (`"field"` / `"column"` — those live inside
 *   `<FormFieldZone>` / `<TableColumnZone>`).
 */
export function renderContribution(
  contribution: IZoneContribution,
  context: IZoneContext,
): ReactElement | null {
  switch (contribution.kind) {
    case "react": {
      // React arm — mount the contribution's component with the
      // context prop. Give the element a stable key derived from
      // the contribution id so React's reconciler can diff a list
      // of contributions correctly.
      return createElement(contribution.component, {
        key: contribution.id,
        context,
      });
    }
    case "sdui": {
      // SDUI arm — delegate to `<SduiNodeView>`. Optional peer:
      // missing SDUI means we log once and return `null`.
      const SduiNodeView = resolveSduiNodeView();
      if (!SduiNodeView) {
        warnOnce(
          `sdui-peer-missing:${contribution.id}`,
          `zone contribution "${contribution.id}" is kind "sdui" but ` +
            `@stackra/sdui is not installed. Install @stackra/sdui as ` +
            `a peer to render SDUI contributions.`,
        );
        return null;
      }
      // `createElement(component, props)` doesn't accept a `key`
      // as a value prop — pass it separately in the third arg to
      // stabilise reconciliation.
      return createElement(SduiNodeView as never, {
        key: contribution.id,
        node: contribution.node,
      });
    }
    case "field":
    case "column": {
      // These kinds only make sense inside their specialised
      // hosts. Seeing them here means the caller registered them
      // against a general `<Zone>` — warn once + render nothing.
      warnOnce(
        `wrong-host:${context.zoneId}:${contribution.id}:${contribution.kind}`,
        `zone contribution "${contribution.id}" is kind "${contribution.kind}" ` +
          `but is registered against a general <Zone> host in zone ` +
          `"${context.zoneId}". "${contribution.kind}" contributions ` +
          `belong inside <${contribution.kind === "field" ? "FormField" : "TableColumn"}Zone>.`,
      );
      return null;
    }
    default: {
      // Exhaustiveness guard — a new `kind` added to the tagged
      // union with no case here fires this branch. Assigning to a
      // `never`-typed local + voiding it consumes the value so
      // TypeScript's `noUnusedLocals` doesn't fire while still
      // giving us the compile-time check that every `kind` is
      // handled above.
      const _exhaustive: never = contribution;
      void _exhaustive;
      return null;
    }
  }
}
