/**
 * @file time-helpers.spec.ts
 * @module @stackra/testing/__tests__/unit
 * @description Behavioural spec for the `freezeTime` / `travelTo` /
 *   `restoreTime` helpers. Every downstream package that needs
 *   deterministic time in its tests relies on these; a regression
 *   here silently produces flaky test suites across the workspace.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { freezeTime, restoreTime, travelTo } from "../../src/core/time-helpers";

// Real time is restored between every test — matches the workspace
// setup hook contract so this spec runs identically standalone or
// under the shared preset.
afterEach(() => {
  restoreTime();
});

describe("freezeTime", () => {
  it("with no argument, snaps Date.now() to the current real wall-clock", () => {
    const beforeReal = Date.now();
    freezeTime();
    const frozen = Date.now();
    // Frozen value is very close to (or equal to) the pre-freeze read.
    expect(Math.abs(frozen - beforeReal)).toBeLessThan(50);

    // Time no longer advances while frozen.
    const readAgain = Date.now();
    expect(readAgain).toBe(frozen);
  });

  it("accepts a Date argument", () => {
    const target = new Date("2026-01-01T00:00:00.000Z");
    freezeTime(target);
    expect(Date.now()).toBe(target.getTime());
    expect(new Date().toISOString()).toBe(target.toISOString());
  });

  it("accepts an ISO-string argument", () => {
    freezeTime("2026-06-15T12:00:00.000Z");
    expect(new Date().toISOString()).toBe("2026-06-15T12:00:00.000Z");
  });

  it("accepts a numeric timestamp argument", () => {
    freezeTime(0);
    expect(Date.now()).toBe(0);
    expect(new Date().getUTCFullYear()).toBe(1970);
  });

  it("second freezeTime() call replaces the previous frozen moment", () => {
    freezeTime(new Date("2026-01-01T00:00:00.000Z"));
    expect(Date.now()).toBe(new Date("2026-01-01T00:00:00.000Z").getTime());

    freezeTime(new Date("2026-12-31T23:59:59.000Z"));
    expect(Date.now()).toBe(new Date("2026-12-31T23:59:59.000Z").getTime());
  });

  it("freezes setTimeout — callbacks don't fire until timers advance", () => {
    freezeTime(new Date("2026-01-01T00:00:00.000Z"));
    const cb = vi.fn();
    setTimeout(cb, 1000);
    // Wall-clock advance doesn't fire fake timers automatically.
    expect(cb).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1000);
    expect(cb).toHaveBeenCalledOnce();
  });
});

describe("travelTo", () => {
  it("advances a frozen clock forward", () => {
    freezeTime(new Date("2026-01-01T00:00:00.000Z"));
    travelTo(new Date("2026-06-15T00:00:00.000Z"));
    expect(new Date().toISOString()).toBe("2026-06-15T00:00:00.000Z");
  });

  it("rewinds a frozen clock backward", () => {
    freezeTime(new Date("2026-06-15T00:00:00.000Z"));
    travelTo(new Date("2026-01-01T00:00:00.000Z"));
    expect(new Date().toISOString()).toBe("2026-01-01T00:00:00.000Z");
  });

  it("accepts every argument shape freezeTime does", () => {
    freezeTime(new Date("2026-01-01T00:00:00.000Z"));
    travelTo("2026-02-14T00:00:00.000Z");
    expect(new Date().toISOString()).toBe("2026-02-14T00:00:00.000Z");
    travelTo(0);
    expect(Date.now()).toBe(0);
  });
});

describe("restoreTime", () => {
  it("returns real time after a freeze", () => {
    freezeTime(new Date("2026-01-01T00:00:00.000Z"));
    expect(Date.now()).toBe(new Date("2026-01-01T00:00:00.000Z").getTime());

    restoreTime();
    // After restore, Date.now() moves — subsequent reads differ over
    // a small window. Prove by advancing real time slightly and
    // observing that the two reads differ (or by comparing to a
    // real-ish value).
    const t1 = Date.now();
    // Real time has already progressed past 2026-01-01.
    expect(t1).toBeGreaterThan(new Date("2026-01-02").getTime());
  });

  it("is a no-op when time was never frozen", () => {
    // Should not throw regardless.
    expect(() => restoreTime()).not.toThrow();
  });

  it("dropping fake timers means setTimeout runs on the real event loop", async () => {
    freezeTime(new Date("2026-01-01T00:00:00.000Z"));
    const cb = vi.fn();
    setTimeout(cb, 5);
    // Frozen — not called even after a real await.
    await Promise.resolve();
    expect(cb).not.toHaveBeenCalled();

    restoreTime();
    // Now real timers — schedule + await tick.
    const cb2 = vi.fn();
    setTimeout(cb2, 1);
    await new Promise((resolve) => setTimeout(resolve, 5));
    expect(cb2).toHaveBeenCalledOnce();
  });
});
