/**
 * @file assertable-proxy.spec.ts
 * @module @stackra/testing/__tests__/unit
 * @description Behavioural spec for `createAssertableProxy` — the
 *   Proxy wrapper that forwards every function-typed member call to
 *   the wrapped target while recording it on an attached
 *   `Assertable` bookkeeper.
 *
 *   Every downstream test package's mock-service pattern relies on
 *   this primitive:
 *     const mock = createAssertableProxy(new RealService());
 *     mock.doStuff();
 *     mock.$.assertCalled('doStuff').once();
 *
 *   The spec covers: forwarding, recording, non-function passthrough,
 *   stub short-circuit for `stub` / `stubImplementation` /
 *   `stubThrow`, and the `$` / `ASSERTABLE_SYMBOL` accessors.
 */

import { describe, expect, it, vi } from "vitest";
import {
  ASSERTABLE_SYMBOL,
  createAssertableProxy,
} from "../../src/core/assertable-proxy";

/** Real-ish service used as the wrap target across the tests. */
class UserService {
  public name = "user-service";

  public getUser(id: string): { id: string; role: string } {
    return { id, role: "admin" };
  }

  public save(user: { id: string }): boolean {
    return user.id.length > 0;
  }

  public fail(): never {
    throw new Error("real-fail");
  }

  public greet(who: string): string {
    return `hello, ${who}`;
  }
}

describe("createAssertableProxy — surface", () => {
  it("exposes the bookkeeper on `$`", () => {
    const mock = createAssertableProxy(new UserService());
    expect(mock.$).toBeDefined();
    // Only `$` and the ASSERTABLE_SYMBOL should be non-service members.
    // `wasCalled` is on the bookkeeper, not the proxy directly.
    expect(typeof mock.$.wasCalled).toBe("function");
  });

  it("exposes the bookkeeper on `ASSERTABLE_SYMBOL` too", () => {
    const mock = createAssertableProxy(new UserService());
    // Symbol.for('...') returns the same symbol across imports, so
    // consumers using a collision-proof accessor still reach the
    // bookkeeper without depending on the `$` alias.
    expect(
      (mock as unknown as Record<symbol, unknown>)[ASSERTABLE_SYMBOL],
    ).toBe(mock.$);
  });

  it("preserves the same bookkeeper across property reads", () => {
    const mock = createAssertableProxy(new UserService());
    expect(mock.$).toBe(mock.$);
  });

  it("passes through non-function properties unchanged", () => {
    const mock = createAssertableProxy(new UserService());
    expect(mock.name).toBe("user-service");
    // Reading a plain property does NOT record a call.
    expect(mock.$.totalCalls).toBe(0);
  });
});

describe("createAssertableProxy — forwarding + recording", () => {
  it("forwards a method call to the real target and returns the value", () => {
    const mock = createAssertableProxy(new UserService());
    expect(mock.getUser("42")).toEqual({ id: "42", role: "admin" });
  });

  it("records forwarded calls with the invocation args + return value", () => {
    const mock = createAssertableProxy(new UserService());
    mock.getUser("42");
    mock.save({ id: "u-99" });

    expect(mock.$.wasCalled("getUser")).toBe(true);
    expect(mock.$.wasCalledWith("getUser", "42")).toBe(true);
    expect(mock.$.callCount("save")).toBe(1);

    const [getUserCall] = mock.$.callsFor("getUser");
    expect(getUserCall?.returnValue).toEqual({ id: "42", role: "admin" });
  });

  it("records a thrown error and re-throws it (fail-loud)", () => {
    const mock = createAssertableProxy(new UserService());
    expect(() => mock.fail()).toThrowError("real-fail");
    const [failCall] = mock.$.callsFor("fail");
    expect(failCall?.error).toBeInstanceOf(Error);
    expect((failCall?.error as Error).message).toBe("real-fail");
  });

  it("binds `this` to the underlying target — method uses target state", () => {
    class Counter {
      private n = 10;
      public increment(): number {
        this.n += 1;
        return this.n;
      }
    }
    const mock = createAssertableProxy(new Counter());
    expect(mock.increment()).toBe(11);
    expect(mock.increment()).toBe(12);
    expect(mock.$.callCount("increment")).toBe(2);
  });
});

describe("createAssertableProxy — stub short-circuits", () => {
  it("stub() replaces the return value and does NOT invoke the real method", () => {
    const mock = createAssertableProxy(new UserService());
    // Spy on the underlying prototype to prove the real method is skipped.
    const spy = vi.spyOn(UserService.prototype, "greet");

    mock.$.stub("greet", "custom-stub");

    expect(mock.greet("world")).toBe("custom-stub");
    expect(spy).not.toHaveBeenCalled();
    // The call is still recorded so tests can assert on it.
    expect(mock.$.wasCalledWith("greet", "world")).toBe(true);
    expect(mock.$.callsFor("greet")[0]?.returnValue).toBe("custom-stub");

    spy.mockRestore();
  });

  it("stubImplementation() runs the callback with the original args", () => {
    const mock = createAssertableProxy(new UserService());
    mock.$.stubImplementation("greet", (who: string) => `sup, ${who}`);
    expect(mock.greet("bob")).toBe("sup, bob");
    // Recorded — with the return value from the stub.
    expect(mock.$.callsFor("greet")[0]?.returnValue).toBe("sup, bob");
  });

  it("stubImplementation() re-throws (and records) when the impl throws", () => {
    const mock = createAssertableProxy(new UserService());
    const err = new Error("stub-fail");
    mock.$.stubImplementation("greet", (): never => {
      throw err;
    });
    expect(() => mock.greet("bob")).toThrow(err);
    expect(mock.$.callsFor("greet")[0]?.error).toBe(err);
  });

  it("stubThrow() throws the configured value and records the call", () => {
    const mock = createAssertableProxy(new UserService());
    const err = new Error("thrown-stub");
    mock.$.stubThrow("greet", err);
    expect(() => mock.greet("bob")).toThrow(err);
    expect(mock.$.callsFor("greet")[0]?.error).toBe(err);
  });

  it("clearStubs() restores the pass-through forwarding", () => {
    const mock = createAssertableProxy(new UserService());
    mock.$.stub("greet", "stubbed");
    expect(mock.greet("bob")).toBe("stubbed");

    mock.$.clearStubs();
    // Now the real implementation runs.
    expect(mock.greet("bob")).toBe("hello, bob");
  });
});

describe("createAssertableProxy — edge cases", () => {
  it("wrapping a plain object (no prototype methods) works — every function property is forwarded", () => {
    const target = {
      compute: (n: number): number => n * 3,
    };
    const mock = createAssertableProxy(target);
    expect(mock.compute(4)).toBe(12);
    expect(mock.$.wasCalledWith("compute", 4)).toBe(true);
  });

  it("reset() on the bookkeeper clears history without breaking the proxy", () => {
    const mock = createAssertableProxy(new UserService());
    mock.getUser("42");
    mock.$.reset();

    // The next call is recorded from a clean slate.
    mock.getUser("99");
    expect(mock.$.totalCalls).toBe(1);
    expect(mock.$.wasCalledWith("getUser", "99")).toBe(true);
  });
});
