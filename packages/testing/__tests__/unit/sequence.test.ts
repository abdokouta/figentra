/**
 * @file sequence.test.ts
 * @module @stackra/testing/__tests__/unit
 * @description Unit tests for the `Sequence` counter used by factory
 *   fixtures — covers default start = 1, post-increment on `.next()`,
 *   non-mutating `.peek()`, and `.reset()` behaviour.
 */

import { describe, expect, it } from "vitest";

import { Sequence } from "@/core/factories";

describe("Sequence", () => {
  describe("defaults", () => {
    it("starts at 1", () => {
      const seq = new Sequence();
      expect(seq.next()).toBe(1);
    });
  });

  describe(".next()", () => {
    it("returns the current value then post-increments", () => {
      const seq = new Sequence();
      expect(seq.next()).toBe(1);
      expect(seq.next()).toBe(2);
      expect(seq.next()).toBe(3);
    });
  });

  describe(".peek()", () => {
    it("returns the next value without advancing the counter", () => {
      const seq = new Sequence();
      expect(seq.peek()).toBe(1);
      expect(seq.peek()).toBe(1); // still 1 — not advanced
      expect(seq.next()).toBe(1);
      expect(seq.peek()).toBe(2);
    });
  });

  describe(".reset()", () => {
    it("returns to the configured start value", () => {
      const seq = new Sequence();
      seq.next();
      seq.next();
      seq.next();
      seq.reset();
      expect(seq.next()).toBe(1);
    });

    it("honours a custom start value", () => {
      const seq = new Sequence(100);
      expect(seq.next()).toBe(100);
      expect(seq.next()).toBe(101);
      seq.reset();
      expect(seq.next()).toBe(100);
    });
  });

  describe("custom start values", () => {
    it.each([
      [0, 0],
      [5, 5],
      [-3, -3],
      [1_000_000, 1_000_000],
    ])("start=%i → first .next() = %i", (start, expected) => {
      expect(new Sequence(start).next()).toBe(expected);
    });
  });
});
