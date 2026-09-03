/**
 * @file resolve-zone-order.util.ts
 * @module @stackra/zones/core/utils
 * @description Pure ordering algorithm — merges intrinsic host
 *   children with cross-module contributions according to each
 *   contribution's `position`, `anchor`, and `order` fields, then
 *   filters through every contribution's optional `when(ctx)`
 *   predicate.
 *
 *   The algorithm is deterministic and side-effect-free (safe to
 *   memoise). It never touches React or the DOM — the `<Zone>`
 *   renderer applies the output to actual JSX / RN views.
 *
 *   ## Algorithm (design.md §5.2)
 *
 *   1. Filter every contribution through `when(ctx)` — drop when
 *      the predicate returns `false`.
 *   2. Bucket by insertion strategy:
 *      - `startBucket` — every contribution with `position: "start"`.
 *      - `endBucket` — every contribution with `position: "end"`, plus
 *        every contribution that declared no `anchor` (fallback).
 *      - `beforeBucket: Map<anchor, Contribution[]>` — every
 *        `position: "before"` grouped by its anchor.
 *      - `afterBucket: Map<anchor, Contribution[]>` — same for
 *        `"after"`.
 *      - `replaceBucket: Map<anchor, Contribution>` — first-wins
 *        `"replace"`; subsequent replaces on the same anchor warn
 *        once and fall through to `"end"`.
 *   3. Sort every bucket ascending by `order` (default `100`).
 *      ES2019 `Array.prototype.sort` is stable — ties fall back to
 *      the original registration order the caller passed in.
 *   4. Anchor fallback — when a contribution's `anchor` matches no
 *      intrinsic child id AND no other contribution's id, log a
 *      warning (once per unique anchor per call) and treat the
 *      contribution as `position: "end"`.
 *   5. Walk intrinsic children in declared order. For each child C:
 *
 *      ```
 *      out.push(...before[C.id] ?? [])
 *      out.push(replace[C.id] ?? { kind: "intrinsic", child: C })
 *      out.push(...after[C.id] ?? [])
 *      ```
 *
 *   6. Prepend `startBucket` at position 0 (order-sorted).
 *   7. Append `endBucket` at the tail (order-sorted).
 *
 *   ## Warnings
 *
 *   The algorithm may log up to three kinds of warning at
 *   dev-time — all fail-soft:
 *
 *   - Missing anchor for `before` / `after` — falls back to `end`.
 *   - Missing anchor for `replace` — falls back to `end`.
 *   - Duplicate `replace` on the same anchor — first wins, second
 *     falls back to `end`.
 *
 *   Warnings are deduplicated with the {@link warnOnce} helper so a
 *   noisy call site can't drown the console. The dedup key includes
 *   the zone id + the anchor + the warning kind, so a genuinely
 *   different contribution mistake still surfaces.
 */

import type { IZoneContext, IZoneContribution } from "@stackra/contracts";

import { DEFAULT_ORDER } from "../constants/default-order.constant";
import type { IntrinsicChild, OrderedItem } from "../interfaces";

// ════════════════════════════════════════════════════════════════════
// Dedup key registry — keeps `console.warn` bounded per call
// ════════════════════════════════════════════════════════════════════

/**
 * Dedup keys we've already warned about in this session. Prevents
 * a `<Zone>` that re-renders 60 times per second from producing
 * 60x the same warning; the key composition (zone id + anchor +
 * kind) still distinguishes genuinely different mistakes.
 */
const WARNED_KEYS = new Set<string>();

/**
 * Emit a `console.warn` at most once per unique `key` per session.
 *
 * Safe under React StrictMode — the second warning attempt is a
 * no-op, matching the pattern used across every workspace runtime
 * that tolerates double-invocation.
 */
function warnOnce(key: string, message: string): void {
  if (WARNED_KEYS.has(key)) return;
  WARNED_KEYS.add(key);
  // eslint-disable-next-line no-console
  console.warn(`[@stackra/zones] ${message}`);
}

// ════════════════════════════════════════════════════════════════════
// Bucket assembly + sort helpers
// ════════════════════════════════════════════════════════════════════

/**
 * The bucket shape the algorithm builds up before the merge walk.
 */
interface IBuckets {
  readonly start: IZoneContribution[];
  readonly end: IZoneContribution[];
  readonly before: Map<string, IZoneContribution[]>;
  readonly after: Map<string, IZoneContribution[]>;
  readonly replace: Map<string, IZoneContribution>;
}

/**
 * Compare two contributions by `order` (default 100). Stable when
 * equal — the caller's insertion order survives per ES2019's stable
 * `Array.prototype.sort`.
 */
function compareOrder(a: IZoneContribution, b: IZoneContribution): number {
  const orderA = a.order ?? DEFAULT_ORDER;
  const orderB = b.order ?? DEFAULT_ORDER;
  return orderA - orderB;
}

/**
 * Push into a `Map<string, Contribution[]>` bucket, creating the
 * array lazily.
 */
function pushToMap(
  map: Map<string, IZoneContribution[]>,
  key: string,
  contribution: IZoneContribution,
): void {
  const list = map.get(key);
  if (list) {
    list.push(contribution);
  } else {
    map.set(key, [contribution]);
  }
}

// ════════════════════════════════════════════════════════════════════
// Public entry point
// ════════════════════════════════════════════════════════════════════

/**
 * Merge intrinsic children with contributions into a single ordered
 * list the renderer walks left-to-right.
 *
 * Pure — same inputs produce the same output. Safe to `useMemo` the
 * result inside a React component; the algorithm never touches the
 * DOM, React state, or global timers.
 *
 * See the file-level docblock above for the full algorithm.
 *
 * @param intrinsic - Host-authored children in declared order.
 *   Each carries a stable `id` used as an anchor target.
 * @param contributions - Every cross-module contribution registered
 *   for this zone (already filtered to the zone by the caller —
 *   this function does NOT re-filter by `contribution.zone`).
 * @param ctx - Runtime context. Every contribution's `when(ctx)`
 *   predicate receives this and can drop itself by returning
 *   `false`.
 * @returns The ordered list of items the renderer mounts.
 *
 * @example
 * ```ts
 * const ordered = resolveZoneOrder(
 *   [{ kind: "react", id: "search", node: <SearchInput /> }],
 *   registry.list("users.list.header"),
 *   { zoneId: "users.list.header", permissions: [], features: [],
 *     params: {} },
 * );
 * // → [OrderedItem, OrderedItem, ...]
 * ```
 */
export function resolveZoneOrder(
  intrinsic: readonly IntrinsicChild[],
  contributions: readonly IZoneContribution[],
  ctx: IZoneContext,
): readonly OrderedItem[] {
  // Step 1 — filter through `when(ctx)`.
  const visible = contributions.filter((c) => {
    if (!c.when) return true;
    try {
      return c.when(ctx) !== false;
    } catch (error: unknown) {
      // `when` threw — fail-soft, drop the contribution.
      // Log once per `(zoneId, id)` so a broken predicate is
      // visible without spamming.
      warnOnce(
        `when-threw:${ctx.zoneId}:${c.id}`,
        `contribution "${c.id}" in zone "${ctx.zoneId}" threw from when(ctx); ` +
          `dropping contribution. Fix the predicate or drop \`when\`. ` +
          `error: ${String(error)}`,
      );
      return false;
    }
  });

  // Precompute the set of anchor-eligible ids — every intrinsic id
  // and every visible contribution id. `anchor` fallbacks compare
  // against this union.
  const intrinsicIds = new Set(intrinsic.map((c) => c.id));
  const contributionIds = new Set(visible.map((c) => c.id));

  // Step 2 — bucket by strategy.
  const buckets: IBuckets = {
    start: [],
    end: [],
    before: new Map(),
    after: new Map(),
    replace: new Map(),
  };

  for (const contribution of visible) {
    const position = contribution.position ?? "end";

    if (position === "start") {
      buckets.start.push(contribution);
      continue;
    }
    if (position === "end") {
      buckets.end.push(contribution);
      continue;
    }

    // The remaining three positions (`before` / `after` / `replace`)
    // require an anchor. Missing anchor OR unresolvable anchor falls
    // back to `end` with a warn-once.
    const anchor = contribution.anchor;

    if (!anchor) {
      // A missing anchor on a directional position is a common
      // authoring mistake. Warn once + fall back.
      warnOnce(
        `no-anchor:${ctx.zoneId}:${contribution.id}:${position}`,
        `contribution "${contribution.id}" declared position "${position}" ` +
          `but no anchor in zone "${ctx.zoneId}"; ` +
          `falling back to position "end".`,
      );
      buckets.end.push(contribution);
      continue;
    }

    const anchorExists =
      intrinsicIds.has(anchor) || contributionIds.has(anchor);
    if (!anchorExists) {
      warnOnce(
        `missing-anchor:${ctx.zoneId}:${anchor}`,
        `contribution "${contribution.id}" anchors on "${anchor}" ` +
          `but zone "${ctx.zoneId}" has no intrinsic child or contribution ` +
          `with that id; falling back to position "end".`,
      );
      buckets.end.push(contribution);
      continue;
    }

    if (position === "before") {
      pushToMap(buckets.before, anchor, contribution);
    } else if (position === "after") {
      pushToMap(buckets.after, anchor, contribution);
    } else if (position === "replace") {
      const existing = buckets.replace.get(anchor);
      if (existing) {
        // Second replace on the same anchor — first wins.
        warnOnce(
          `duplicate-replace:${ctx.zoneId}:${anchor}`,
          `two contributions ("${existing.id}", "${contribution.id}") ` +
            `both replace anchor "${anchor}" in zone "${ctx.zoneId}"; ` +
            `first wins, second falls back to position "end".`,
        );
        buckets.end.push(contribution);
      } else {
        buckets.replace.set(anchor, contribution);
      }
    }
  }

  // Step 3 — sort every bucket by `order` (stable on ties).
  buckets.start.sort(compareOrder);
  buckets.end.sort(compareOrder);
  for (const list of buckets.before.values()) list.sort(compareOrder);
  for (const list of buckets.after.values()) list.sort(compareOrder);

  // Step 5 — walk intrinsic children.
  const out: OrderedItem[] = [];

  // Step 6 — prepend `start` bucket.
  for (const contribution of buckets.start) {
    out.push({ kind: "contribution", contribution });
  }

  for (const child of intrinsic) {
    const before = buckets.before.get(child.id);
    if (before) {
      for (const contribution of before) {
        out.push({ kind: "contribution", contribution });
      }
    }

    const replacement = buckets.replace.get(child.id);
    if (replacement) {
      out.push({ kind: "contribution", contribution: replacement });
    } else {
      out.push({ kind: "intrinsic", child });
    }

    const after = buckets.after.get(child.id);
    if (after) {
      for (const contribution of after) {
        out.push({ kind: "contribution", contribution });
      }
    }
  }

  // Step 7 — append `end` bucket.
  for (const contribution of buckets.end) {
    out.push({ kind: "contribution", contribution });
  }

  return out;
}

/**
 * Reset the internal warn-once dedup registry. Test-only — exposed so
 * a Vitest suite can assert warning behaviour deterministically across
 * multiple cases.
 */
export function __resetZoneOrderWarnings(): void {
  WARNED_KEYS.clear();
}
