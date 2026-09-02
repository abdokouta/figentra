/**
 * @file sleep.spec.ts
 * @module @stackra/support/__tests__/unit
 * @description Behavioural spec for the `sleep(ms)` helper.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sleep } from "../../src/utils/sleep.util";

describe("sleep", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setTimeout"] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns a Promise that resolves after the delay", async () => {
    const spy = vi.fn();
    const promise = sleep(100).then(spy);

    // Before the delay — not resolved yet.
    expect(spy).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(100);
    await promise;
    expect(spy).toHaveBeenCalledOnce();
  });

  it("resolves to undefined (void promise contract)", async () => {
    const promise = sleep(0);
    await vi.advanceTimersByTimeAsync(0);
    await expect(promise).resolves.toBeUndefined();
  });

  it("accepts 0 as an immediate-resolve request", async () => {
    const spy = vi.fn();
    void sleep(0).then(spy);
    // Even for zero, the callback is scheduled as a macrotask —
    // advancing timers is required.
    await vi.advanceTimersByTimeAsync(0);
    expect(spy).toHaveBeenCalledOnce();
  });

  it("does not resolve early — advancing by less than the delay leaves the promise pending", async () => {
    const spy = vi.fn();
    void sleep(100).then(spy);

    await vi.advanceTimersByTimeAsync(99);
    expect(spy).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(spy).toHaveBeenCalledOnce();
  });
});
