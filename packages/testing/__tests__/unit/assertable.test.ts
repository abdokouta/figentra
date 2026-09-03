/**
 * @file assertable.test.ts
 * @module @stackra/testing/__tests__/unit
 * @description Unit tests for `createAssertableProxy` — the workspace's
 *   canonical mock factory. Covers call recording, non-method
 *   pass-through, stub/return control, forced errors, error-capture in
 *   history, deep-equal arg matching, async waiting via `.$.until`, and
 *   both the modern `.$` API + legacy shortcut surface.
 */

import { describe, expect, it } from "vitest";

import { createAssertableProxy } from "@/core/assertable";

// ─── Test doubles ──────────────────────────────────────────────────
//
// A small in-memory service exercising the surface the proxy needs
// to record (methods with args + return values, methods that throw,
// non-method properties).

interface IUser {
  readonly id: number;
  readonly name: string;
}

class InMemoryUserService {
  public readonly version = "1.0.0";
  private readonly store = new Map<number, IUser>();

  public save(user: IUser): IUser {
    this.store.set(user.id, user);
    return user;
  }

  public find(id: number): IUser | undefined {
    return this.store.get(id);
  }

  public list(): readonly IUser[] {
    return [...this.store.values()];
  }

  public boom(): never {
    throw new Error("intentional real-method throw");
  }
}

describe("createAssertableProxy", () => {
  // ── Recording ─────────────────────────────────────────────────

  describe("call recording", () => {
    it("records the method, args, result, and threw=false on a normal call", () => {
      const svc = createAssertableProxy(new InMemoryUserService());
      const user: IUser = { id: 1, name: "Ada" };

      const result = svc.save(user);

      expect(result).toBe(user);
      const history = svc.$.history();
      expect(history).toHaveLength(1);
      const entry = history[0]!;
      expect(entry.method).toBe("save");
      expect(entry.args).toEqual([user]);
      expect(entry.result).toBe(user);
      expect(entry.threw).toBe(false);
      expect(typeof entry.timestamp).toBe("number");
    });

    it("passes through non-method properties without recording", () => {
      const svc = createAssertableProxy(new InMemoryUserService());

      expect(svc.version).toBe("1.0.0");
      expect(svc.$.history()).toEqual([]);
      expect(svc.$.totalCalls()).toBe(0);
    });

    it("records the total call count across every method", () => {
      const svc = createAssertableProxy(new InMemoryUserService());
      svc.save({ id: 1, name: "Ada" });
      svc.find(1);
      svc.list();

      expect(svc.$.totalCalls()).toBe(3);
    });

    it("records errors thrown by the underlying method and rethrows", () => {
      const svc = createAssertableProxy(new InMemoryUserService());

      expect(() => svc.boom()).toThrow("intentional real-method throw");

      const entry = svc.$.history().at(-1)!;
      expect(entry.method).toBe("boom");
      expect(entry.threw).toBe(true);
      expect(entry.result).toBeInstanceOf(Error);
      expect((entry.result as Error).message).toBe("intentional real-method throw");
    });

    it("preserves the original method behaviour (real target runs)", () => {
      const svc = createAssertableProxy(new InMemoryUserService());
      svc.save({ id: 1, name: "Ada" });
      svc.save({ id: 2, name: "Grace" });

      expect(svc.list()).toEqual([
        { id: 1, name: "Ada" },
        { id: 2, name: "Grace" },
      ]);
    });
  });

  // ── Assertion API (.$) ─────────────────────────────────────────

  describe(".$.wasCalled / wasCalledWith / callCount / calls", () => {
    it("wasCalled returns true only after the method is invoked", () => {
      const svc = createAssertableProxy(new InMemoryUserService());
      expect(svc.$.wasCalled("save")).toBe(false);
      svc.save({ id: 1, name: "Ada" });
      expect(svc.$.wasCalled("save")).toBe(true);
      expect(svc.$.wasCalled("find")).toBe(false);
    });

    it("wasCalledWith uses deep-equal matching on the argument list", () => {
      const svc = createAssertableProxy(new InMemoryUserService());
      const user: IUser = { id: 1, name: "Ada" };
      svc.save(user);

      // Same shape, different reference — must match deep-equal.
      expect(svc.$.wasCalledWith("save", [{ id: 1, name: "Ada" }])).toBe(true);
      // Different shape — must NOT match.
      expect(svc.$.wasCalledWith("save", [{ id: 1, name: "Bob" }])).toBe(false);
      // Wrong method — must NOT match.
      expect(svc.$.wasCalledWith("find", [1])).toBe(false);
    });

    it("callCount counts invocations per method", () => {
      const svc = createAssertableProxy(new InMemoryUserService());
      svc.find(1);
      svc.find(2);
      svc.list();

      expect(svc.$.callCount("find")).toBe(2);
      expect(svc.$.callCount("list")).toBe(1);
      expect(svc.$.callCount("save")).toBe(0);
    });

    it("calls returns arg-lists in invocation order", () => {
      const svc = createAssertableProxy(new InMemoryUserService());
      svc.find(1);
      svc.find(2);
      svc.find(3);

      expect(svc.$.calls("find")).toEqual([[1], [2], [3]]);
    });

    it("calls returns a fresh copy each invocation (not the internal slice)", () => {
      const svc = createAssertableProxy(new InMemoryUserService());
      svc.find(1);

      const a = svc.$.calls("find");
      const b = svc.$.calls("find");
      expect(a).not.toBe(b);
      expect(a).toEqual(b);
    });
  });

  // ── Stubs & forced errors ──────────────────────────────────────

  describe(".$.returns / clearReturn / throws", () => {
    it("returns overrides the underlying method with a static value", () => {
      const svc = createAssertableProxy(new InMemoryUserService());
      const stub: IUser = { id: 99, name: "STUB" };
      svc.$.returns("find", stub);

      expect(svc.find(1)).toBe(stub);
      expect(svc.find(2)).toBe(stub);
    });

    it("returns accepts a function that receives the call args", () => {
      const svc = createAssertableProxy(new InMemoryUserService());
      svc.$.returns("find", (id: number) => ({
        id,
        name: `stub-${id}`,
      }));

      expect(svc.find(7)).toEqual({ id: 7, name: "stub-7" });
      expect(svc.find(42)).toEqual({ id: 42, name: "stub-42" });
    });

    it("clearReturn restores the real underlying method", () => {
      const svc = createAssertableProxy(new InMemoryUserService());
      const real: IUser = { id: 1, name: "Ada" };
      svc.save(real);

      svc.$.returns("find", { id: 99, name: "STUB" });
      expect(svc.find(1)).toEqual({ id: 99, name: "STUB" });

      svc.$.clearReturn("find");
      expect(svc.find(1)).toBe(real);
    });

    it("throws forces an error once, then clears itself", () => {
      const svc = createAssertableProxy(new InMemoryUserService());
      const err = new Error("forced");
      svc.$.throws("find", err);

      expect(() => svc.find(1)).toThrow("forced");

      // Second call — error is cleared, real method runs (returns undefined).
      expect(svc.find(1)).toBeUndefined();
    });

    it("captures forced errors in the history with threw=true", () => {
      const svc = createAssertableProxy(new InMemoryUserService());
      const err = new Error("forced");
      svc.$.throws("find", err);

      expect(() => svc.find(42)).toThrow(err);

      const entry = svc.$.history().at(-1)!;
      expect(entry.method).toBe("find");
      expect(entry.args).toEqual([42]);
      expect(entry.threw).toBe(true);
      expect(entry.result).toBe(err);
    });
  });

  // ── Reset ─────────────────────────────────────────────────────

  describe(".$.reset", () => {
    it("clears history, stubs, and pending errors", () => {
      const svc = createAssertableProxy(new InMemoryUserService());
      svc.$.returns("find", { id: 42, name: "STUB" });
      svc.$.throws("boom", new Error("forced"));
      svc.find(1);

      svc.$.reset();

      expect(svc.$.history()).toEqual([]);
      expect(svc.$.totalCalls()).toBe(0);
      // Stub cleared — real method now runs (returns undefined for missing id).
      expect(svc.find(1)).toBeUndefined();
      // Forced error cleared — real boom now throws its own message.
      expect(() => svc.boom()).toThrow("intentional real-method throw");
    });
  });

  // ── .$.until ──────────────────────────────────────────────────

  describe(".$.until", () => {
    it("resolves as soon as the required call count is reached", async () => {
      const svc = createAssertableProxy(new InMemoryUserService());

      // Fire an async event that will call `find` after a tick.
      setTimeout(() => svc.find(1), 10);
      setTimeout(() => svc.find(2), 20);

      await svc.$.until("find", 2, 500);
      expect(svc.$.callCount("find")).toBeGreaterThanOrEqual(2);
    });

    it("rejects with a descriptive message on timeout", async () => {
      const svc = createAssertableProxy(new InMemoryUserService());
      await expect(svc.$.until("find", 3, 50)).rejects.toThrow(/Timed out waiting for 'find'/);
    });

    it("defaults to count=1 and resolves immediately when already satisfied", async () => {
      const svc = createAssertableProxy(new InMemoryUserService());
      svc.find(1);
      await expect(svc.$.until("find")).resolves.toBeUndefined();
    });
  });

  // ── Legacy shortcuts ──────────────────────────────────────────

  describe("legacy shortcuts (assertCalled / assertCalledWith / getCalls / reset)", () => {
    it("assertCalled is silent when the method was invoked", () => {
      const svc = createAssertableProxy(new InMemoryUserService());
      svc.list();
      expect(() => svc.assertCalled("list")).not.toThrow();
    });

    it("assertCalled throws a descriptive message when not invoked", () => {
      const svc = createAssertableProxy(new InMemoryUserService());
      expect(() => svc.assertCalled("list")).toThrow(/Expected 'list' to have been called/);
    });

    it("assertCalledWith is silent for a matching call", () => {
      const svc = createAssertableProxy(new InMemoryUserService());
      svc.find(1);
      expect(() => svc.assertCalledWith("find", 1)).not.toThrow();
    });

    it("assertCalledWith throws with recorded calls in the message", () => {
      const svc = createAssertableProxy(new InMemoryUserService());
      svc.find(2);

      expect(() => svc.assertCalledWith("find", 1)).toThrow(
        /Expected 'find' to have been called with/,
      );
      expect(() => svc.assertCalledWith("find", 1)).toThrow(/\[\[2\]\]/);
    });

    it("assertNotCalled throws when the method was invoked", () => {
      const svc = createAssertableProxy(new InMemoryUserService());
      svc.list();
      expect(() => svc.assertNotCalled("list")).toThrow(/Expected 'list' NOT to have been called/);
    });

    it("assertNotCalled is silent when the method was never called", () => {
      const svc = createAssertableProxy(new InMemoryUserService());
      expect(() => svc.assertNotCalled("list")).not.toThrow();
    });

    it("getCalls mirrors .$.calls", () => {
      const svc = createAssertableProxy(new InMemoryUserService());
      svc.find(1);
      svc.find(2);
      expect(svc.getCalls("find")).toEqual([[1], [2]]);
    });

    it("legacy reset() is equivalent to .$.reset()", () => {
      const svc = createAssertableProxy(new InMemoryUserService());
      svc.find(1);
      expect(svc.$.totalCalls()).toBe(1);

      svc.reset();

      expect(svc.$.totalCalls()).toBe(0);
    });
  });
});
