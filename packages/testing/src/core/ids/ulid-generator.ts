/**
 * @file ulid-generator.ts
 * @module @stackra/testing/core/ids
 * @description Deterministic ULID generator for tests. Wraps the
 *   upstream `ulid` package with a seedable RNG so snapshot tests
 *   stay stable across CI runs.
 *
 *   Production code uses `import { ulid } from "ulid"` directly —
 *   that emits a fresh, non-deterministic ID every call. Tests
 *   that assert on an exact ID string need reproducibility, which
 *   is what `createUlidGenerator(seed)` provides.
 */

import { monotonicFactory, ulid as ulidGenerate } from "ulid";

import { Rng } from "../factories/rng";

/**
 * Factory returning a `() => string` ULID generator seeded for
 * determinism.
 *
 * Two shapes:
 *
 * - `createUlidGenerator(seed)` — pure deterministic (same seed →
 *   same sequence of ULIDs every run).
 * - `createUlidGenerator({ seed, monotonic: true })` — guarantees
 *   IDs are lexicographically increasing, at the cost of taking a
 *   dependency on the real clock's forward motion. Combine with
 *   `freezeTime` + `travelBy` for fully controlled ordering.
 *
 * @example
 * ```ts
 * const ulid = createUlidGenerator(42);
 * ulid(); // "01HGP2Q3..." (same every run for seed 42)
 * ```
 */
export function createUlidGenerator(
  optionsOrSeed: number | { readonly seed: number; readonly monotonic?: boolean } = 1,
): () => string {
  const options = typeof optionsOrSeed === "number" ? { seed: optionsOrSeed } : optionsOrSeed;
  const rng = new Rng(options.seed);
  const prng = (): number => rng.next();

  if (options.monotonic) {
    // `monotonicFactory` takes a PRNG and returns a monotonic
    // generator. We ignore the optional `seedTime` argument on the
    // returned callable and let it read the (potentially fake)
    // clock via freezeTime/travelBy.
    const generator = monotonicFactory(prng);
    return () => generator();
  }

  // The v3 `ulid` package dropped the `factory()` export. We
  // reproduce its shape by calling `ulid(seedTime?, prng?)` per
  // call — passing our seeded PRNG as the second argument.
  return () => ulidGenerate(undefined, prng);
}
