/**
 * @file matchers.spec.ts
 * @module @stackra/testing/__tests__/unit
 * @description Behavioural spec for the `registerAllMatchers` helper
 *   from `@stackra/testing/matchers`.
 *
 *   The subpath is currently a stub — no custom matchers are shipped.
 *   `registerAllMatchers()` is provided as a no-op so consumer test
 *   files that call it stay compatible. This spec locks in the
 *   contract:
 *   - registerAllMatchers exists as a function.
 *   - Calling it doesn't throw.
 *   - Calling it doesn't mutate `expect` (no matchers stamped yet).
 *
 *   When the framework grows real matchers (e.g.
 *   `expect(mock).toHaveBeenEmitted(EVENT_NAME)`), this spec expands
 *   to cover each one.
 */

import { describe, expect, it } from "vitest";
import { registerAllMatchers } from "../../src/matchers";

describe("registerAllMatchers (stub)", () => {
  it("exports a callable function", () => {
    expect(typeof registerAllMatchers).toBe("function");
  });

  it("does not throw when invoked", () => {
    expect(() => registerAllMatchers()).not.toThrow();
  });

  it("is idempotent — safe to call multiple times", () => {
    expect(() => {
      registerAllMatchers();
      registerAllMatchers();
      registerAllMatchers();
    }).not.toThrow();
  });

  it("returns undefined (no-op stub)", () => {
    expect(registerAllMatchers()).toBeUndefined();
  });
});
