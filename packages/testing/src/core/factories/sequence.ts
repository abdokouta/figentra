/**
 * @file sequence.ts
 * @module @stackra/testing/core/factories
 * @description Monotonic counter for factory sequences.
 *
 *   Every factory keeps its own `Sequence` — `.next()` yields the
 *   current value and post-increments. Independent factories DO NOT
 *   share sequences; that keeps test IDs deterministic per aggregate.
 */

/**
 * Auto-incrementing counter for factory-generated identifiers.
 *
 * @example
 * ```ts
 * const seq = new Sequence(); // starts at 1
 * seq.next(); // 1
 * seq.next(); // 2
 * seq.peek(); // 3
 * seq.reset(); // back to the start
 * ```
 */
export class Sequence {
  private value: number;

  /**
   * @param start - First value returned by `.next()`. Defaults to `1`
   *   so IDs stay 1-indexed by default (`user-1`, `user-2`, ...).
   */
  public constructor(private readonly start: number = 1) {
    this.value = start;
  }

  /** Return the current value + post-increment. */
  public next(): number {
    return this.value++;
  }

  /** Return the value that `.next()` would produce, without advancing. */
  public peek(): number {
    return this.value;
  }

  /** Reset the counter to its start value. */
  public reset(): void {
    this.value = this.start;
  }
}
