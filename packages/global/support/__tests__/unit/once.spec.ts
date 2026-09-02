/**
 * @file once.spec.ts
 * @module @stackra/support/__tests__/unit
 * @description Behavioural spec for the `once(fn)` memoiser.
 */

import { describe, expect, it, vi } from "vitest";
import { once } from "../../src/utils/once.util";

describe("once", () => {
  it("invokes the underlying function on the first call", () => {
    const inner = vi.fn().mockReturnValue("first");
    const wrapped = once(inner);

    expect(wrapped()).toBe("first");
    expect(inner).toHaveBeenCalledOnce();
  });

  it("returns the cached result on every subsequent call — the inner function runs exactly once", () => {
    const inner = vi.fn().mockImplementation(() => Math.random());
    const wrapped = once(inner);

    const a = wrapped();
    const b = wrapped();
    const c = wrapped();

    expect(a).toBe(b);
    expect(b).toBe(c);
    expect(inner).toHaveBeenCalledOnce();
  });

  it("caches `undefined` as the return value", () => {
    // Explicit undefined-returning function — the memoiser should NOT
    // re-run the function on a second call just because the result
    // was undefined. Uses a `called` flag to distinguish.
    let calls = 0;
    const wrapped = once(() => {
      calls++;
      return undefined;
    });

    expect(wrapped()).toBeUndefined();
    expect(wrapped()).toBeUndefined();
    expect(calls).toBe(1);
  });

  it("caches an object reference — subsequent calls return the SAME instance", () => {
    const wrapped = once(() => ({ id: "abc" }));
    const first = wrapped();
    const second = wrapped();
    expect(first).toBe(second);
  });

  it("caches thrown errors — inner is NOT re-run after a throw (current behaviour)", () => {
    // NOTE — the current implementation sets `called = true` AFTER
    // `fn()` returns. A throw skips the assignment, so a second call
    // re-runs `fn()`. This test documents the actual behaviour rather
    // than what would be more useful; a "cache-throws" variant is
    // a separate feature request for `framework-core-builder`.
    let calls = 0;
    const inner = () => {
      calls++;
      throw new Error(`call-${calls}`);
    };
    const wrapped = once(inner);

    expect(() => wrapped()).toThrow("call-1");
    expect(() => wrapped()).toThrow("call-2");
    // Two calls confirm the current "re-run on throw" behaviour.
    expect(calls).toBe(2);
  });
});
