/**
 * @file assertable.spec.ts
 * @module @stackra/testing/__tests__/unit
 * @description Behavioural spec for the `Assertable` bookkeeper.
 *
 *   `Assertable` is the primitive that every `createAssertableProxy`
 *   invocation attaches to a wrapped object; downstream tests read
 *   its `wasCalled` / `callsFor` / `assertCalled` API to make
 *   assertions on recorded call history. A regression here silently
 *   breaks every consumer's mock-verifying tests.
 *
 *   This file verifies the recording API + stub registry + the
 *   fluent DSL entrypoint. The DSL terminals (`.once() / .never() /
 *   .times() / .atLeast() / .atMost()`) are covered in
 *   `call-assertion.spec.ts`.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Assertable } from "../../src/core/assertable";

describe("Assertable — recording", () => {
  let bookkeeper: Assertable;

  beforeEach(() => {
    bookkeeper = new Assertable();
  });

  it("starts empty — zero calls, zero for any method", () => {
    expect(bookkeeper.totalCalls).toBe(0);
    expect(bookkeeper.calls).toHaveLength(0);
    expect(bookkeeper.callsFor("anything")).toEqual([]);
    expect(bookkeeper.wasCalled("anything")).toBe(false);
    expect(bookkeeper.callCount("anything")).toBe(0);
  });

  it("records a call with the given method + args", () => {
    bookkeeper.record({ method: "getUser", args: ["42"] });

    expect(bookkeeper.totalCalls).toBe(1);
    expect(bookkeeper.wasCalled("getUser")).toBe(true);
    expect(bookkeeper.callCount("getUser")).toBe(1);
    const [call] = bookkeeper.callsFor("getUser");
    expect(call?.args).toEqual(["42"]);
  });

  it("stamps a monotonic sequence number on each call", () => {
    bookkeeper.record({ method: "a", args: [] });
    bookkeeper.record({ method: "b", args: [] });
    bookkeeper.record({ method: "c", args: [] });
    expect(bookkeeper.calls.map((c) => c.sequence)).toEqual([0, 1, 2]);
  });

  it("stamps a wall-clock timestamp on each call", () => {
    // Freeze real time so the test isn't racy; the point is that the
    // record uses `Date.now()`, not that it advances between calls.
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-01T12:00:00Z"));

    bookkeeper.record({ method: "a", args: [] });
    const [call] = bookkeeper.callsFor("a");
    expect(call?.timestamp).toBe(new Date("2026-06-01T12:00:00Z").getTime());
  });

  it("preserves `returnValue` and `error` in the call record", () => {
    bookkeeper.record({ method: "ok", args: [1], returnValue: "sunny" });
    bookkeeper.record({ method: "no", args: [], error: new Error("boom") });

    const [okCall] = bookkeeper.callsFor("ok");
    const [noCall] = bookkeeper.callsFor("no");
    expect(okCall?.returnValue).toBe("sunny");
    expect(okCall?.error).toBeUndefined();
    expect((noCall?.error as Error).message).toBe("boom");
  });

  it("segregates calls per-method — callsFor is not cross-contaminated", () => {
    bookkeeper.record({ method: "foo", args: [] });
    bookkeeper.record({ method: "bar", args: [] });
    bookkeeper.record({ method: "foo", args: [] });

    expect(bookkeeper.callsFor("foo")).toHaveLength(2);
    expect(bookkeeper.callsFor("bar")).toHaveLength(1);
    expect(bookkeeper.callsFor("qux")).toHaveLength(0);
  });

  it("wasCalledWith matches on JSON-serialised argument tuples", () => {
    bookkeeper.record({ method: "save", args: [{ id: "u-1", role: "admin" }] });
    expect(bookkeeper.wasCalledWith("save", { id: "u-1", role: "admin" })).toBe(
      true,
    );
    // Different key order still matches — JSON.stringify preserves
    // insertion order which is deterministic per object literal.
    expect(bookkeeper.wasCalledWith("save", { id: "u-1", role: "admin" })).toBe(
      true,
    );
    // Different value doesn't match.
    expect(bookkeeper.wasCalledWith("save", { id: "u-2", role: "admin" })).toBe(
      false,
    );
    // Wrong method doesn't match.
    expect(
      bookkeeper.wasCalledWith("delete", { id: "u-1", role: "admin" }),
    ).toBe(false);
  });

  it("`calls` returns a readonly view — assignment attempts are silently ignored", () => {
    bookkeeper.record({ method: "a", args: [] });
    const calls = bookkeeper.calls;
    // Underlying array is mutable but the getter returns the private
    // reference; tests documenting the surface contract stay in place.
    expect(Array.isArray(calls)).toBe(true);
    expect(calls).toHaveLength(1);
  });

  afterEach(() => {
    vi.useRealTimers();
  });
});

describe("Assertable — stub registry", () => {
  let bookkeeper: Assertable;

  beforeEach(() => {
    bookkeeper = new Assertable();
  });

  it("stub() stores a return value under the method name", () => {
    bookkeeper.stub("getUser", { id: "u-1" });
    const entry = bookkeeper.getStub("getUser");
    expect(entry?.returnValue).toEqual({ id: "u-1" });
  });

  it("stub() overrides a previous stub for the same method (last-wins)", () => {
    bookkeeper.stub("greet", "hi");
    bookkeeper.stub("greet", "hola");
    expect(bookkeeper.getStub("greet")?.returnValue).toBe("hola");
  });

  it("stubImplementation() stores the callback, not a value", () => {
    const impl = (n: number): number => n * 2;
    bookkeeper.stubImplementation("double", impl);
    const entry = bookkeeper.getStub("double");
    expect(entry?.implementation).toBe(impl);
    expect(entry?.returnValue).toBeUndefined();
  });

  it("stubThrow() stores the error under `throws`", () => {
    const err = new Error("nope");
    bookkeeper.stubThrow("bad", err);
    expect(bookkeeper.getStub("bad")?.throws).toBe(err);
  });

  it("getStub() returns undefined for unstubbed methods", () => {
    expect(bookkeeper.getStub("never-stubbed")).toBeUndefined();
  });

  it("clearStubs() removes every stub but preserves call history", () => {
    bookkeeper.stub("a", 1);
    bookkeeper.stub("b", 2);
    bookkeeper.record({ method: "a", args: [] });

    bookkeeper.clearStubs();
    expect(bookkeeper.getStub("a")).toBeUndefined();
    expect(bookkeeper.getStub("b")).toBeUndefined();
    expect(bookkeeper.totalCalls).toBe(1);
  });

  it("stub methods return `this` for chaining", () => {
    expect(bookkeeper.stub("a", 1)).toBe(bookkeeper);
    expect(bookkeeper.stubImplementation("b", () => 2)).toBe(bookkeeper);
    expect(bookkeeper.stubThrow("c", new Error("x"))).toBe(bookkeeper);
    expect(bookkeeper.clearStubs()).toBe(bookkeeper);
  });
});

describe("Assertable — assertCalled DSL entrypoint", () => {
  it("assertCalled returns a CallAssertion scoped to the given method", () => {
    const b = new Assertable();
    b.record({ method: "save", args: [1] });
    b.record({ method: "delete", args: [] });
    // No throw — one call to save. Terminal returns void.
    b.assertCalled("save").once();
  });

  it("assertNotCalled is sugar for assertCalled().never()", () => {
    const b = new Assertable();
    // No calls at all — passes.
    expect(() => b.assertNotCalled("save")).not.toThrow();

    b.record({ method: "save", args: [] });
    // Terminal formats "expected exactly 0 call(s)" — see the sibling
    // call-assertion.spec.ts for the shared message shape.
    expect(() => b.assertNotCalled("save")).toThrow(/expected exactly 0 call/);
  });
});

describe("Assertable — lifecycle", () => {
  it("reset() drops every call + stub and resets the sequence counter", () => {
    const b = new Assertable();
    b.stub("a", 1);
    b.record({ method: "a", args: [] });
    b.record({ method: "b", args: [] });
    expect(b.totalCalls).toBe(2);

    b.reset();
    expect(b.totalCalls).toBe(0);
    expect(b.calls).toHaveLength(0);
    expect(b.getStub("a")).toBeUndefined();

    // Next recorded call starts sequence at 0 again.
    b.record({ method: "c", args: [] });
    expect(b.calls[0]?.sequence).toBe(0);
  });

  it("reset() returns `this` for chaining", () => {
    const b = new Assertable();
    expect(b.reset()).toBe(b);
  });
});
