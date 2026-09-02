/**
 * @file tap.spec.ts
 * @module @stackra/support/__tests__/unit
 * @description Behavioural spec for the `tap(value, cb)` helper.
 */

import { describe, expect, it, vi } from "vitest";
import { tap } from "../../src/utils/tap.util";

describe("tap", () => {
  it("returns the value it was called with", () => {
    expect(tap(42, () => {})).toBe(42);
    expect(tap("hello", () => {})).toBe("hello");
    expect(tap(null, () => {})).toBe(null);
    expect(tap(undefined, () => {})).toBe(undefined);
  });

  it("invokes the callback with the value", () => {
    const cb = vi.fn();
    tap({ id: "u-1" }, cb);
    expect(cb).toHaveBeenCalledWith({ id: "u-1" });
  });

  it("permits in-place mutation through the callback", () => {
    const config = tap({ host: "localhost", port: 3000 }, (c) => {
      c.port = 8080;
    });
    expect(config.port).toBe(8080);
  });

  it("ignores the callback's return value", () => {
    const result = tap("origin", (v) => `mutated-${v}` as unknown as void);
    expect(result).toBe("origin");
  });

  it("returns the same reference — no defensive clone", () => {
    const obj = { x: 1 };
    const returned = tap(obj, (o) => {
      o.x = 2;
    });
    expect(returned).toBe(obj);
    expect(obj.x).toBe(2);
  });
});
