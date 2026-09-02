/**
 * @file timebox.spec.ts
 * @module @stackra/support/__tests__/unit
 * @description Behavioural spec for `timebox(fn, microseconds)`.
 *
 *   The helper's job is to guarantee a minimum wall-clock time
 *   regardless of the underlying `fn`'s outcome. Real timers are
 *   used because the helper measures via `performance.now()` — fake
 *   timers freeze that too, which would break the assertion shape.
 */

import { describe, expect, it } from "vitest";
import { timebox } from "../../src/utils/timebox.util";

describe("timebox", () => {
  it("returns the resolved value of the wrapped function", async () => {
    const result = await timebox(async () => "ok", 5_000); // 5ms minimum
    expect(result).toBe("ok");
  });

  it("guarantees at least the minimum wall-clock time when the function returns fast", async () => {
    // 20ms minimum, wrapped function returns immediately.
    const start = performance.now();
    await timebox(async () => "fast", 20_000);
    const elapsed = performance.now() - start;
    // Allow a small tolerance for scheduling — the assertion is
    // "did NOT return faster than the floor".
    expect(elapsed).toBeGreaterThanOrEqual(19);
  });

  it("re-throws the error from the wrapped function AFTER waiting for the floor", async () => {
    const start = performance.now();
    await expect(
      timebox(async (): Promise<never> => {
        throw new Error("boom");
      }, 20_000),
    ).rejects.toThrow("boom");
    const elapsed = performance.now() - start;
    // Success and failure paths must both hit the floor — timing
    // side-channel-safe.
    expect(elapsed).toBeGreaterThanOrEqual(19);
  });

  it("does not wait beyond the natural function duration when the function is slower than the floor", async () => {
    // Wrapped fn takes ~30ms; floor is 10ms. Total should be roughly
    // the natural duration, not the floor + the duration.
    const start = performance.now();
    await timebox(
      () =>
        new Promise<string>((resolve) => {
          setTimeout(() => resolve("slow"), 30);
        }),
      10_000,
    );
    const elapsed = performance.now() - start;
    // Roughly 30ms — never adds the floor on top when already over.
    // The upper bound is generous to allow for jitter under CI load.
    expect(elapsed).toBeLessThan(60);
    expect(elapsed).toBeGreaterThanOrEqual(29);
  });
});
