/**
 * @file rng.ts
 * @module @stackra/testing/core/factories
 * @description Deterministic pseudo-random-number generator for
 *   fixture builders. Backed by `mulberry32` — a tiny public-domain
 *   PRNG with adequate distribution for test data (32-bit state,
 *   period ~2^32, no cryptographic guarantees).
 *
 *   Why NOT `Math.random()` — flaky snapshots. Two consecutive CI
 *   runs of the same test produce different outputs, breaking
 *   golden-file comparisons. A seeded RNG solves that at zero cost.
 */

/**
 * Seeded pseudo-random generator.
 *
 * Reproducible across runs with the same seed:
 *
 * ```ts
 * const rng = new Rng(42);
 * rng.next(); // 0.61...
 * rng.next(); // 0.02...
 *
 * const other = new Rng(42);
 * other.next(); // 0.61... (same)
 * ```
 */
export class Rng {
  private state: number;

  /**
   * @param seed - Any positive integer. Default `1` — deterministic
   *   default output for tests that don't reseed.
   */
  public constructor(private readonly seed: number = 1) {
    // mulberry32 accepts any 32-bit integer as its state.
    this.state = seed >>> 0;
  }

  /**
   * Return a float in the range `[0, 1)`. Uniform distribution.
   *
   * Algorithm: mulberry32 — one of the smallest 32-bit PRNGs with
   * passable statistical properties. Fine for fixture data; do
   * NOT use for anything security-sensitive.
   */
  public next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Return an integer in the range `[min, max]` (both inclusive).
   *
   * @param min - Minimum value (inclusive).
   * @param max - Maximum value (inclusive).
   */
  public int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /** Return `true` with the given probability (default 0.5). */
  public bool(probability: number = 0.5): boolean {
    return this.next() < probability;
  }

  /**
   * Return a random element from `items`. Throws when the array
   * is empty (empty pick is almost always a test bug — fail loud).
   */
  public pick<T>(items: readonly T[]): T {
    if (items.length === 0) {
      throw new Error("Rng.pick: cannot pick from an empty array.");
    }
    return items[this.int(0, items.length - 1)] as T;
  }

  /**
   * Return a Fisher-Yates-shuffled copy of `items`.
   *
   * The input is NOT mutated — safe to pass in `readonly` arrays.
   */
  public shuffle<T>(items: readonly T[]): T[] {
    const out = items.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = this.int(0, i);
      [out[i], out[j]] = [out[j] as T, out[i] as T];
    }
    return out;
  }

  /** Reseed with a fresh value. Resets internal state. */
  public reseed(seed: number): void {
    this.state = seed >>> 0;
  }

  /** Read-only view of the original seed. */
  public get initialSeed(): number {
    return this.seed;
  }
}
