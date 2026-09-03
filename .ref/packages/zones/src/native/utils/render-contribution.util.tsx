/**
 * @file render-contribution.util.tsx
 * @module @stackra/zones/native/utils
 * @description `renderContribution(contribution, context)` for RN —
 *   mirrors the web helper, but imports `@stackra/sdui/native`
 *   instead of `@stackra/sdui/react` for the `"sdui"` arm.
 */

import { createElement, type ReactElement } from "react";
import type { IZoneContext, IZoneContribution } from "@stackra/contracts";

// ════════════════════════════════════════════════════════════════════
// SDUI-optional resolver
// ════════════════════════════════════════════════════════════════════

type SduiNodeViewComponent =
  | ((props: { readonly node: unknown }) => ReactElement | null)
  | { readonly type: string };

let cachedSduiNodeView: SduiNodeViewComponent | null | undefined;

/**
 * Attempt to resolve the SDUI native runtime's node view. On RN
 * the SDUI native subpath doesn't expose an `SduiNodeView` (as of
 * the shipping surface — the RN runtime is renderer-per-type),
 * so this returns `null` and the "sdui" arm degrades to a
 * warn-once no-op. When the RN SDUI runtime grows an equivalent
 * `SduiNodeView`, this resolver picks it up automatically.
 */
function resolveSduiNodeView(): SduiNodeViewComponent | null {
  if (cachedSduiNodeView !== undefined) return cachedSduiNodeView;
  try {
    // Runtime require — same optional-peer pattern as the web
    // helper. The string identifier prevents Metro from failing
    // when `@stackra/sdui` isn't installed.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = (0, eval)("require")("@stackra/sdui/native") as {
      readonly SduiNodeView?: SduiNodeViewComponent;
    };
    cachedSduiNodeView = mod?.SduiNodeView ?? null;
  } catch {
    cachedSduiNodeView = null;
  }
  return cachedSduiNodeView;
}

export function __resetSduiNodeViewCache(): void {
  cachedSduiNodeView = undefined;
}

// ════════════════════════════════════════════════════════════════════
// Warn-once
// ════════════════════════════════════════════════════════════════════

const WARNED_KEYS = new Set<string>();

function warnOnce(key: string, message: string): void {
  if (WARNED_KEYS.has(key)) return;
  WARNED_KEYS.add(key);
  // eslint-disable-next-line no-console
  console.warn(`[@stackra/zones] ${message}`);
}

export function __resetRenderContributionWarnings(): void {
  WARNED_KEYS.clear();
}

// ════════════════════════════════════════════════════════════════════
// Public entry point
// ════════════════════════════════════════════════════════════════════

/**
 * Render one contribution on RN — pick the right path per `kind`.
 */
export function renderContribution(
  contribution: IZoneContribution,
  context: IZoneContext,
): ReactElement | null {
  switch (contribution.kind) {
    case "react": {
      return createElement(contribution.component, {
        key: contribution.id,
        context,
      });
    }
    case "sdui": {
      const SduiNodeView = resolveSduiNodeView();
      if (!SduiNodeView) {
        warnOnce(
          `sdui-peer-missing:${contribution.id}`,
          `zone contribution "${contribution.id}" is kind "sdui" but ` +
            `@stackra/sdui/native does not expose an <SduiNodeView>. ` +
            `Register the RN SDUI runtime OR route the contribution ` +
            `through a "react" kind.`,
        );
        return null;
      }
      return createElement(SduiNodeView as never, {
        key: contribution.id,
        node: contribution.node,
      });
    }
    case "field":
    case "column": {
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
      // Exhaustiveness guard — see web helper for full rationale.
      const _exhaustive: never = contribution;
      void _exhaustive;
      return null;
    }
  }
}
