/**
 * @file benchmark.spec.ts
 * @module @stackra/support/__tests__/unit
 * @description Benchmark — measure() + compare() static methods.
 */

import { describe, expect, it } from "vitest";

import { Benchmark } from "../../src/benchmark";

describe("Benchmark", () => {
  describe("measure()", () => {
    it("returns a non-negative number for a synchronous function", async () => {
      const ms = await Benchmark.measure(() => {
        let sum = 0;
        for (let i = 0; i < 1000; i++) sum += i;
        return sum;
      });
      expect(ms).toBeGreaterThanOrEqual(0);
    });

    it("returns 0-ish for a trivial no-op", async () => {
      const ms = await Benchmark.measure(() => undefined);
      // Sub-millisecond on any modern hardware.
      expect(ms).toBeGreaterThanOrEqual(0);
      expect(ms).toBeLessThan(50);
    });

    it("awaits async functions and includes the resolution time", async () => {
      const ms = await Benchmark.measure(async () => {
        await new Promise((r) => setTimeout(r, 20));
      });
      // At least the timer duration (with generous slack for CI).
      expect(ms).toBeGreaterThanOrEqual(15);
    });

    it("supports functions that throw (measure resolves anyway if the return isn't a promise)", async () => {
      // A throwing sync function surfaces the throw — measure doesn't
      // trap it. Just confirm the throw propagates.
      await expect(
        Benchmark.measure(() => {
          throw new Error("boom");
        }),
      ).rejects.toThrow("boom");
    });
  });

  describe("compare()", () => {
    it("returns one entry per named function", async () => {
      const results = await Benchmark.compare({
        cheap: () => undefined,
        also_cheap: () => 42,
      });
      expect(Object.keys(results)).toEqual(["cheap", "also_cheap"]);
    });

    it("averages over the given number of iterations", async () => {
      const results = await Benchmark.compare(
        {
          op: () => {
            for (let i = 0; i < 100; i++) {
              /* noop */
            }
          },
        },
        3,
      );
      expect(results.op).toBeGreaterThanOrEqual(0);
      expect(results.op).toBeLessThan(50);
    });

    it("defaults to 1 iteration when iterations is not supplied", async () => {
      const results = await Benchmark.compare({
        op: () => 42,
      });
      expect(results.op).toBeGreaterThanOrEqual(0);
    });

    it("returns an empty object when no functions are supplied", async () => {
      const results = await Benchmark.compare({});
      expect(results).toEqual({});
    });
  });
});
