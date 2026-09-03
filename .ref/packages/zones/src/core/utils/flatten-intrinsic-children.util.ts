/**
 * @file flatten-intrinsic-children.util.ts
 * @module @stackra/zones/core/utils
 * @description Extracts stable ids from React children so
 *   `resolveZoneOrder(...)` can anchor contributions against them.
 *
 *   Every intrinsic child MUST carry a stable id — the algorithm
 *   uses it as the anchor lookup key. Two sources are accepted (in
 *   priority order):
 *
 *   1. `props.id` — the child element declared its own id.
 *   2. `key` — the React key. Falls back to this when `props.id` is
 *      absent.
 *
 *   Anonymous children (no `props.id`, no `key`) trigger a dev-time
 *   warning and get a synthesised id (`__zone-<index>`) so the
 *   algorithm still runs. Consumers who see that warning should
 *   add a `key` to their JSX — anchor lookups against the auto-id
 *   won't be stable across renders.
 *
 *   Cross-platform: this util uses ONLY `react` (no DOM, no RN
 *   primitives), so it lives in `core/` and is re-exported from
 *   both `react/` and `native/` subpaths.
 */

import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";

import type { IntrinsicChild } from "../interfaces";

// ════════════════════════════════════════════════════════════════════
// Dedup registry — matches the algorithm's warn-once pattern
// ════════════════════════════════════════════════════════════════════

const WARNED_KEYS = new Set<string>();

function warnOnce(key: string, message: string): void {
  if (WARNED_KEYS.has(key)) return;
  WARNED_KEYS.add(key);
  // eslint-disable-next-line no-console
  console.warn(`[@stackra/zones] ${message}`);
}

/**
 * Reset the flatten-intrinsic-children warn-once registry.
 * Test-only helper used to keep the Vitest suite deterministic
 * across multiple assertion cases.
 */
export function __resetFlattenWarnings(): void {
  WARNED_KEYS.clear();
}

// ════════════════════════════════════════════════════════════════════
// Public entry point
// ════════════════════════════════════════════════════════════════════

/**
 * Walk a React `ReactNode` tree and produce an ordered list of
 * `IntrinsicChild` records the zone-ordering algorithm can consume.
 *
 * Only DIRECT children of the enclosing `<Zone>` are considered.
 * The util does NOT recurse into nested React elements — anchor ids
 * are addressed at the top level, so nesting would break the mental
 * model.
 *
 * Non-element children (strings, numbers, `null`, `undefined`) are
 * filtered out silently — anchor targeting only makes sense against
 * React elements.
 *
 * @param children - The `ReactNode` handed to `<Zone>` as children.
 * @param zoneId - Zone id — used for the missing-id warn-once dedup
 *   key so a same-name mistake across two zones surfaces separately.
 * @returns Ordered list of intrinsic-child records the algorithm
 *   consumes.
 *
 * @example
 * ```tsx
 * <Zone id="users.list.header">
 *   <SearchInput id="search" />
 *   <ExportButton id="export" />
 * </Zone>
 * // → [{ kind: "react", id: "search", ... },
 * //    { kind: "react", id: "export", ... }]
 * ```
 */
export function flattenIntrinsicChildren(
  children: ReactNode,
  zoneId: string,
): readonly IntrinsicChild[] {
  const out: IntrinsicChild[] = [];
  let anonymousIndex = 0;

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) {
      // Text, numbers, null, undefined — skip.
      return;
    }

    // React element — extract the id.
    const element = child as ReactElement<{ id?: unknown }>;
    const props = (element.props ?? {}) as { readonly id?: unknown };

    // Prefer `props.id`; fall back to `key`; synthesise on miss.
    let id: string | undefined;
    if (typeof props.id === "string" && props.id.length > 0) {
      id = props.id;
    } else if (typeof element.key === "string" && element.key.length > 0) {
      id = element.key;
    }

    if (!id) {
      const typeName =
        typeof element.type === "string"
          ? element.type
          : ((element.type as { displayName?: string; name?: string })
              ?.displayName ??
            (element.type as { displayName?: string; name?: string })?.name ??
            "unknown");
      warnOnce(
        `no-id:${zoneId}:${typeName}:${anonymousIndex}`,
        `intrinsic child <${typeName}> in zone "${zoneId}" has no ` +
          `stable id (props.id or key). Anchor lookups against this ` +
          `child won't be stable across renders. Add \`id\` or \`key\` ` +
          `to the JSX.`,
      );
      id = `__zone-${zoneId}-${anonymousIndex}`;
      anonymousIndex += 1;
    }

    out.push({ kind: "react", id, node: element });
  });

  return out;
}
