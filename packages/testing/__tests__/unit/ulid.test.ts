/**
 * @file ulid.test.ts
 * @module @stackra/testing/__tests__/unit
 * @description Unit tests for `createUlidGenerator` — the deterministic
 *   ULID generator. Verifies seed reproducibility, output shape,
 *   different-seed divergence, and the monotonic variant's
 *   lexicographic ordering guarantee.
 */

import { afterEach, describe, expect, it } from "vitest";

import { createUlidGenerator } from "@/core/ids";
import { freezeTime, restoreTime, travelBy } from "@/core/time";

const ULID_PATTERN = /^[0-7][0-9A-HJKMNP-TV-Z]{25}$/;

describe("createUlidGenerator", () => {
  afterEach(() => {
    restoreTime();
  });

  // ── Determinism ───────────────────────────────────────────────

  describe("determinism (via seeded RNG)", () => {
    it("produces identical ULID sequences for the same seed at the same instant", () => {
      // The upstream `ulid` factory pulls the time from Date.now(), so
      // we freeze it to make the full ULID (time + randomness)
      // reproducible.
      freezeTime("2026-01-01T00:00:00Z");
      const a = createUlidGenerator(42);
      const b = createUlidGenerator(42);

      for (let i = 0; i < 5; i++) {
        expect(a()).toBe(b());
      }
    });

    it("produces different sequences for different seeds", () => {
      freezeTime("2026-01-01T00:00:00Z");
      const a = createUlidGenerator(1);
      const b = createUlidGenerator(2);

      // At least one of the first three IDs must differ.
      const firstThreeA = [a(), a(), a()];
      const firstThreeB = [b(), b(), b()];
      expect(firstThreeA).not.toEqual(firstThreeB);
    });

    it("defaults to seed=1 when no argument is supplied", () => {
      freezeTime("2026-01-01T00:00:00Z");
      const withDefault = createUlidGenerator();
      const withSeed1 = createUlidGenerator(1);
      expect(withDefault()).toBe(withSeed1());
    });
  });

  // ── Output shape ──────────────────────────────────────────────

  describe("output shape", () => {
    it("emits 26-character Crockford base32 strings with leading digit in [0-7]", () => {
      const gen = createUlidGenerator(42);
      for (let i = 0; i < 25; i++) {
        const value = gen();
        expect(value).toMatch(ULID_PATTERN);
        expect(value).toHaveLength(26);
      }
    });

    it.each([1, 2, 42, 999, 123_456])("produces valid ULIDs for seed=%i", (seed) => {
      const gen = createUlidGenerator(seed);
      expect(gen()).toMatch(ULID_PATTERN);
    });
  });

  // ── Monotonic mode ────────────────────────────────────────────

  describe("monotonic mode", () => {
    it("produces lexicographically increasing IDs across time travel", () => {
      freezeTime("2026-01-01T00:00:00Z");
      const gen = createUlidGenerator({ seed: 42, monotonic: true });

      const ids: string[] = [];
      for (let i = 0; i < 5; i++) {
        ids.push(gen());
        travelBy(1);
      }

      const sorted = [...ids].sort();
      expect(ids).toEqual(sorted);
    });

    it("produces IDs matching the ULID pattern", () => {
      freezeTime("2026-01-01T00:00:00Z");
      const gen = createUlidGenerator({ seed: 42, monotonic: true });
      for (let i = 0; i < 10; i++) {
        expect(gen()).toMatch(ULID_PATTERN);
      }
    });

    it("stays monotonic even when the clock does NOT advance", () => {
      // With time frozen, monotonic mode falls back to incrementing
      // the random component so ordering survives same-instant emits.
      freezeTime("2026-01-01T00:00:00Z");
      const gen = createUlidGenerator({ seed: 7, monotonic: true });

      const ids = Array.from({ length: 10 }, () => gen());
      const sorted = [...ids].sort();
      expect(ids).toEqual(sorted);
    });
  });
});
