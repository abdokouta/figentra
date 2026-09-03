/**
 * @file time.test.ts
 * @module @stackra/testing/__tests__/unit
 * @description Unit tests for the time-control helpers — `freezeTime`,
 *   `travelTo`, `travelBy`, `restoreTime`, `now`. Verifies fake-clock
 *   engagement, relative + absolute movement, safe cleanup, and
 *   idempotency.
 *
 *   The `/setup` entry (already loaded by our vitest.setup.ts) calls
 *   `restoreTime()` in `afterEach`, so each test runs on a clean
 *   real-clock baseline.
 */

import { afterEach, describe, expect, it } from "vitest";

import {
  freezeTime,
  now,
  restoreTime,
  travelBy,
  travelTo,
} from "@/core/time";

describe("time control", () => {
  // Belt-and-suspenders: the global setup restores time after every
  // test, but we also restore explicitly here so a hypothetical
  // hook-order change never leaks a fake clock into the next suite.
  afterEach(() => {
    restoreTime();
  });

  // ── freezeTime ─────────────────────────────────────────────────

  describe("freezeTime()", () => {
    it("engages the fake clock and anchors it to the given instant", () => {
      freezeTime("2026-01-01T00:00:00Z");
      expect(now().toISOString()).toBe("2026-01-01T00:00:00.000Z");
      expect(Date.now()).toBe(new Date("2026-01-01T00:00:00Z").getTime());
    });

    it("accepts a Date instance", () => {
      const target = new Date("2027-06-15T10:30:00Z");
      freezeTime(target);
      expect(now().getTime()).toBe(target.getTime());
    });

    it("accepts an epoch-ms number", () => {
      freezeTime(1_700_000_000_000);
      expect(Date.now()).toBe(1_700_000_000_000);
    });

    it("is idempotent — repeated calls are safe", () => {
      freezeTime("2026-01-01T00:00:00Z");
      freezeTime("2026-01-01T00:00:00Z");
      freezeTime("2026-01-01T00:00:00Z");
      expect(Date.now()).toBe(new Date("2026-01-01T00:00:00Z").getTime());
    });

    it("preserves the anchor when called with no argument after a prior freeze", () => {
      freezeTime("2026-01-01T00:00:00Z");
      const before = Date.now();
      freezeTime(); // no-arg — should NOT reset the clock
      expect(Date.now()).toBe(before);
    });
  });

  // ── travelTo ──────────────────────────────────────────────────

  describe("travelTo()", () => {
    it("moves the fake clock to an absolute instant", () => {
      freezeTime("2026-01-01T00:00:00Z");
      travelTo("2026-01-01T00:05:00Z");
      expect(now().toISOString()).toBe("2026-01-01T00:05:00.000Z");
    });

    it("engages the fake clock even when not previously frozen", () => {
      travelTo("2028-12-31T23:59:59Z");
      expect(now().toISOString()).toBe("2028-12-31T23:59:59.000Z");
    });

    it("accepts a Date value", () => {
      const target = new Date("2030-07-04T00:00:00Z");
      travelTo(target);
      expect(now().getTime()).toBe(target.getTime());
    });
  });

  // ── travelBy ──────────────────────────────────────────────────

  describe("travelBy()", () => {
    it("advances the fake clock by a positive millisecond delta", () => {
      freezeTime("2026-01-01T00:00:00Z");
      travelBy(60_000);
      expect(now().toISOString()).toBe("2026-01-01T00:01:00.000Z");
    });

    it("moves the fake clock backwards on a negative delta", () => {
      freezeTime("2026-01-01T00:05:00Z");
      travelBy(-60_000);
      expect(now().toISOString()).toBe("2026-01-01T00:04:00.000Z");
    });

    it("composes across multiple calls", () => {
      freezeTime("2026-01-01T00:00:00Z");
      travelBy(1_000);
      travelBy(2_000);
      travelBy(3_000);
      expect(now().toISOString()).toBe("2026-01-01T00:00:06.000Z");
    });

    it("auto-engages the fake clock when called cold", () => {
      travelBy(1_000);
      // No throw + real clock has been replaced (any subsequent
      // reads use the fake); assertion is the absence of throw.
      expect(typeof now().getTime()).toBe("number");
    });
  });

  // ── restoreTime ───────────────────────────────────────────────

  describe("restoreTime()", () => {
    it("releases the fake clock — subsequent Date.now reads real time", async () => {
      freezeTime("2000-01-01T00:00:00Z");
      const frozenAt = Date.now();
      restoreTime();
      // Real clock is well past 2000-01-01; test would fail if the
      // fake clock leaked.
      expect(Date.now()).toBeGreaterThan(frozenAt + 1_000_000_000);
    });

    it("is a no-op when the clock isn't frozen", () => {
      expect(() => restoreTime()).not.toThrow();
      expect(() => restoreTime()).not.toThrow();
    });

    it("is safe to call repeatedly", () => {
      freezeTime("2026-01-01T00:00:00Z");
      restoreTime();
      expect(() => restoreTime()).not.toThrow();
      expect(() => restoreTime()).not.toThrow();
    });
  });

  // ── now() ─────────────────────────────────────────────────────

  describe("now()", () => {
    it("reflects the fake clock when frozen", () => {
      freezeTime("2026-06-15T12:00:00Z");
      expect(now().toISOString()).toBe("2026-06-15T12:00:00.000Z");
    });

    it("returns a fresh Date each call", () => {
      freezeTime("2026-01-01T00:00:00Z");
      const a = now();
      const b = now();
      expect(a).not.toBe(b);
      expect(a.getTime()).toBe(b.getTime());
    });
  });
});
