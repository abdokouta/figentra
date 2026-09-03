/**
 * @file rng.test.ts
 * @module @stackra/testing/__tests__/unit
 * @description Unit tests for the `Rng` deterministic PRNG. Covers
 *   seed determinism, integer range, boolean probability distribution,
 *   `.pick()` semantics + empty-array guard, non-mutating `.shuffle()`,
 *   and `.reseed()`.
 */

import { describe, expect, it } from "vitest";

import { Rng } from "@/core/factories";

describe("Rng", () => {
  // ── Determinism ───────────────────────────────────────────────

  describe("determinism", () => {
    it("produces identical .next() sequences for the same seed", () => {
      const a = new Rng(42);
      const b = new Rng(42);
      for (let i = 0; i < 20; i++) {
        expect(a.next()).toBe(b.next());
      }
    });

    it("produces different sequences for different seeds", () => {
      const a = new Rng(1);
      const b = new Rng(2);
      // At least one of the first five reads should differ — chance
      // of collision under mulberry32 is essentially 0.
      const firstFiveA = [a.next(), a.next(), a.next(), a.next(), a.next()];
      const firstFiveB = [b.next(), b.next(), b.next(), b.next(), b.next()];
      expect(firstFiveA).not.toEqual(firstFiveB);
    });

    it("initialSeed reflects the constructor arg", () => {
      expect(new Rng(42).initialSeed).toBe(42);
      expect(new Rng().initialSeed).toBe(1);
    });
  });

  // ── .next() ───────────────────────────────────────────────────

  describe(".next()", () => {
    it("returns values in [0, 1)", () => {
      const rng = new Rng(1);
      for (let i = 0; i < 500; i++) {
        const n = rng.next();
        expect(n).toBeGreaterThanOrEqual(0);
        expect(n).toBeLessThan(1);
      }
    });
  });

  // ── .int() ────────────────────────────────────────────────────

  describe(".int(min, max)", () => {
    it("stays inclusive of both bounds across many samples", () => {
      const rng = new Rng(1);
      let seenMin = false;
      let seenMax = false;
      for (let i = 0; i < 1000; i++) {
        const n = rng.int(0, 3);
        expect(n).toBeGreaterThanOrEqual(0);
        expect(n).toBeLessThanOrEqual(3);
        expect(Number.isInteger(n)).toBe(true);
        if (n === 0) seenMin = true;
        if (n === 3) seenMax = true;
      }
      // Both endpoints should be reachable across 1000 draws over 4
      // buckets — probability of missing either is <<1e-100.
      expect(seenMin).toBe(true);
      expect(seenMax).toBe(true);
    });

    it("collapses to a single value when min === max", () => {
      const rng = new Rng(42);
      for (let i = 0; i < 20; i++) {
        expect(rng.int(7, 7)).toBe(7);
      }
    });
  });

  // ── .bool() ───────────────────────────────────────────────────

  describe(".bool()", () => {
    it("returns a boolean", () => {
      const rng = new Rng(1);
      expect(typeof rng.bool()).toBe("boolean");
    });

    it("respects a probability of 0 (always false)", () => {
      const rng = new Rng(1);
      for (let i = 0; i < 50; i++) {
        expect(rng.bool(0)).toBe(false);
      }
    });

    it("respects a probability of 1 (always true)", () => {
      const rng = new Rng(1);
      for (let i = 0; i < 50; i++) {
        expect(rng.bool(1)).toBe(true);
      }
    });

    it("roughly honours the specified probability at scale", () => {
      const rng = new Rng(1);
      const samples = 5000;
      let trues = 0;
      for (let i = 0; i < samples; i++) {
        if (rng.bool(0.3)) trues++;
      }
      const ratio = trues / samples;
      // Loose bounds — mulberry32 + 5k samples should easily land
      // within ±0.05 of 0.3.
      expect(ratio).toBeGreaterThan(0.25);
      expect(ratio).toBeLessThan(0.35);
    });
  });

  // ── .pick() ───────────────────────────────────────────────────

  describe(".pick()", () => {
    it("returns an element from the input array", () => {
      const rng = new Rng(1);
      const items = ["a", "b", "c", "d"];
      for (let i = 0; i < 50; i++) {
        expect(items).toContain(rng.pick(items));
      }
    });

    it("throws when the array is empty", () => {
      const rng = new Rng(1);
      expect(() => rng.pick([])).toThrow(/empty array/);
    });

    it("returns the only element when the array has size 1", () => {
      const rng = new Rng(42);
      expect(rng.pick(["only"])).toBe("only");
    });
  });

  // ── .shuffle() ────────────────────────────────────────────────

  describe(".shuffle()", () => {
    it("returns a permutation of the input", () => {
      const rng = new Rng(7);
      const input = [1, 2, 3, 4, 5, 6];
      const out = rng.shuffle(input);
      expect(out.slice().sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it("does NOT mutate the input array", () => {
      const rng = new Rng(1);
      const input = [1, 2, 3, 4, 5];
      const snapshot = [...input];
      rng.shuffle(input);
      expect(input).toEqual(snapshot);
    });

    it("returns a fresh array each invocation", () => {
      const rng = new Rng(1);
      const input = [1, 2, 3];
      const a = rng.shuffle(input);
      const b = rng.shuffle(input);
      expect(a).not.toBe(b);
      expect(a).not.toBe(input);
    });

    it("returns [] for an empty input", () => {
      expect(new Rng(1).shuffle([])).toEqual([]);
    });
  });

  // ── .reseed() ─────────────────────────────────────────────────

  describe(".reseed()", () => {
    it("resets internal state so the same seed reproduces the same run", () => {
      const rng = new Rng(1);
      const before = [rng.next(), rng.next(), rng.next()];
      rng.reseed(1);
      const after = [rng.next(), rng.next(), rng.next()];
      expect(before).toEqual(after);
    });

    it("changes output when reseeded with a different seed", () => {
      const rng = new Rng(1);
      const first = rng.next();
      rng.reseed(999);
      const second = rng.next();
      // Extremely unlikely to collide.
      expect(first).not.toBe(second);
    });
  });
});
