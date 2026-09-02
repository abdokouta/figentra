/**
 * @file call-assertion.spec.ts
 * @module @stackra/testing/__tests__/unit
 * @description Behavioural spec for the fluent `CallAssertion` DSL —
 *   the object returned by `Assertable.assertCalled(method)`. Covers
 *   every terminal (`.once() / .twice() / .times() / .never() /
 *   .atLeast() / .atMost()`), the narrowing `.with(...)` chain, and
 *   the introspection getters (`.calls / .first / .last`).
 *
 *   Terminals are self-throwing. Every negative case verifies the
 *   thrown `Error` message includes the method name + expectation +
 *   observed count so failing assertions read cleanly in a real test
 *   run.
 */

import { describe, expect, it } from "vitest";
import { Assertable } from "../../src/core/assertable";

/** Convenience — one Assertable pre-populated with a canonical call trace. */
function makeBookkeeper(): Assertable {
  const b = new Assertable();
  b.record({ method: "save", args: [{ id: "u-1" }] });
  b.record({ method: "save", args: [{ id: "u-2" }] });
  b.record({ method: "delete", args: [] });
  return b;
}

describe("CallAssertion — terminals (happy path)", () => {
  it("once() passes when exactly one call matches", () => {
    const b = new Assertable();
    b.record({ method: "save", args: [] });
    expect(() => b.assertCalled("save").once()).not.toThrow();
  });

  it("twice() passes when exactly two calls match", () => {
    const b = makeBookkeeper();
    expect(() => b.assertCalled("save").twice()).not.toThrow();
  });

  it("times(n) passes when exactly n calls match", () => {
    const b = makeBookkeeper();
    expect(() => b.assertCalled("save").times(2)).not.toThrow();
    expect(() => b.assertCalled("delete").times(1)).not.toThrow();
  });

  it("never() passes when zero calls match", () => {
    const b = makeBookkeeper();
    expect(() => b.assertCalled("nonexistent").never()).not.toThrow();
  });

  it("atLeast(n) passes when the count meets or exceeds n", () => {
    const b = makeBookkeeper();
    expect(() => b.assertCalled("save").atLeast(1)).not.toThrow();
    expect(() => b.assertCalled("save").atLeast(2)).not.toThrow();
  });

  it("atMost(n) passes when the count meets or falls under n", () => {
    const b = makeBookkeeper();
    expect(() => b.assertCalled("save").atMost(2)).not.toThrow();
    expect(() => b.assertCalled("save").atMost(5)).not.toThrow();
  });
});

describe("CallAssertion — terminals (failure)", () => {
  it("once() throws with a descriptive message when the count is wrong", () => {
    const b = makeBookkeeper();
    // save was called twice — assertion expects exactly 1.
    expect(() => b.assertCalled("save").once()).toThrow(
      /expected exactly 1 call.* save\(\*\).* but received 2/,
    );
  });

  it("times() throws when the count doesn't match", () => {
    const b = makeBookkeeper();
    expect(() => b.assertCalled("save").times(5)).toThrow(/exactly 5 call/);
  });

  it("never() throws when there was at least one matching call", () => {
    const b = makeBookkeeper();
    // Terminal formats as "expected exactly 0 call(s)" — the `.never()`
    // sugar routes through `assertCount(0)` which shares one message
    // shape with `.once()` / `.twice()` / `.times(n)`.
    expect(() => b.assertCalled("save").never()).toThrow(
      /expected exactly 0 call/,
    );
  });

  it("atLeast() throws when the count is below the threshold", () => {
    const b = makeBookkeeper();
    expect(() => b.assertCalled("save").atLeast(5)).toThrow(/at least 5 call/);
  });

  it("atMost() throws when the count is above the threshold", () => {
    const b = makeBookkeeper();
    expect(() => b.assertCalled("save").atMost(1)).toThrow(/at most 1 call/);
  });

  it("error message previews the recorded call history for the method", () => {
    const b = makeBookkeeper();
    try {
      b.assertCalled("save").once();
      throw new Error("should have thrown");
    } catch (err) {
      const msg = (err as Error).message;
      // Full history for the target method is embedded in the message so
      // a failing test in CI shows what actually happened without a repro.
      expect(msg).toContain("Recorded calls for save");
      expect(msg).toContain('#0: save({"id":"u-1"})');
      expect(msg).toContain('#1: save({"id":"u-2"})');
    }
  });
});

describe("CallAssertion — .with(...) narrowing", () => {
  it("filters recorded calls to those matching the exact arg tuple", () => {
    const b = makeBookkeeper();
    // Only one call matches {id: "u-1"} — passes.
    expect(() =>
      b.assertCalled("save").with({ id: "u-1" }).once(),
    ).not.toThrow();
  });

  it("narrowed filter fails when no call matches the args", () => {
    const b = makeBookkeeper();
    // The failing message pluralises "call(s)" — match on the shape
    // rather than "call to" which the current output doesn't produce.
    expect(() => b.assertCalled("save").with({ id: "unknown" }).once()).toThrow(
      /expected exactly 1 call\(s\) to save/,
    );
  });

  it("narrowed .never() passes when the args filter yields no matches", () => {
    const b = makeBookkeeper();
    expect(() =>
      b.assertCalled("save").with({ id: "unknown" }).never(),
    ).not.toThrow();
  });

  it("description reflects the args in the error message", () => {
    const b = new Assertable();
    b.record({ method: "save", args: [{ id: "u-1" }] });
    try {
      b.assertCalled("save").with({ id: "u-2" }).once();
      throw new Error("should have thrown");
    } catch (err) {
      const msg = (err as Error).message;
      expect(msg).toContain('save({"id":"u-2"})');
      // The "matched the filter" hint fires when args narrow the set.
      expect(msg).toContain("matched the filter");
    }
  });

  it("multiple .with() calls narrow further — last one wins per current implementation", () => {
    const b = makeBookkeeper();
    // First .with() finds one call. Second .with() with different args
    // filters that result set — which was already one — down to zero.
    expect(() =>
      b.assertCalled("save").with({ id: "u-1" }).with({ id: "u-2" }).never(),
    ).not.toThrow();
  });
});

describe("CallAssertion — introspection", () => {
  it("`.calls` returns the currently-filtered call list", () => {
    const b = makeBookkeeper();
    const assertion = b.assertCalled("save");
    expect(assertion.calls).toHaveLength(2);
    expect(assertion.with({ id: "u-1" }).calls).toHaveLength(1);
  });

  it("`.first` returns the first matching call (or undefined)", () => {
    const b = makeBookkeeper();
    expect(b.assertCalled("save").first?.args).toEqual([{ id: "u-1" }]);
    expect(b.assertCalled("never-called").first).toBeUndefined();
  });

  it("`.last` returns the last matching call (or undefined)", () => {
    const b = makeBookkeeper();
    expect(b.assertCalled("save").last?.args).toEqual([{ id: "u-2" }]);
    expect(b.assertCalled("never-called").last).toBeUndefined();
  });
});

describe("CallAssertion — value formatting in error messages", () => {
  it("formats `undefined` args as the literal 'undefined'", () => {
    const b = new Assertable();
    b.record({ method: "handle", args: [undefined] });

    try {
      b.assertCalled("handle").with("hello").once();
      throw new Error("should have thrown");
    } catch (err) {
      // The history preview uses `format(undefined) === 'undefined'`.
      expect((err as Error).message).toContain("#0: handle(undefined)");
    }
  });

  it("formats named functions with the '[Function: name]' shape", () => {
    const b = new Assertable();
    function namedCallback(): void {
      /* no-op */
    }
    b.record({ method: "on", args: [namedCallback] });
    try {
      b.assertCalled("on").with("miss").once();
      throw new Error("should have thrown");
    } catch (err) {
      expect((err as Error).message).toContain("[Function: namedCallback]");
    }
  });

  it("formats anonymous functions as '[Function]'", () => {
    const b = new Assertable();
    // Grab the anon by immediately-passed literal so it has no `.name`.
    b.record({
      method: "on",
      args: [Object.defineProperty(() => {}, "name", { value: "" })],
    });
    try {
      b.assertCalled("on").with("miss").once();
      throw new Error("should have thrown");
    } catch (err) {
      expect((err as Error).message).toContain("[Function]");
    }
  });

  // NOTE — a "cyclic-arg" fallback test would exercise the `format()`
  // helper's `catch → String(value)` branch, but the outer `.with(...)`
  // filter uses a raw `JSON.stringify(c.args)` that throws on circular
  // refs BEFORE the format layer runs. That's a latent robustness gap
  // in `CallAssertion.with()`, flagged for `framework-core-builder`
  // in the wave-3 report. The format-fallback branch itself stays
  // covered by the `[Function]` and `[Function: name]` cases above.
});
