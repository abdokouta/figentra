/**
 * @file container.test.ts
 * @module @stackra/testing/__tests__/unit
 * @description Unit tests for `TestContainer` + `createTestContainer`.
 *   Covers the `.provide` / `.set` / `.get` / `.getOptional` / `.has` /
 *   `.resolve` / `.close` surface, error semantics for unknown tokens
 *   (with legible messages for symbol + class tokens), and seeding
 *   via the factory helper.
 */

import { describe, expect, it } from "vitest";

import {
  createTestContainer,
  TestContainer,
  type ITestContainer,
} from "@/core/container";

describe("TestContainer", () => {
  // ── .provide / .get roundtrip ─────────────────────────────────

  describe(".provide + .get", () => {
    it("stores + retrieves a value under a symbol token", () => {
      const TOKEN = Symbol("logger");
      const container = new TestContainer();
      container.provide(TOKEN, { name: "test" });

      expect(container.get(TOKEN)).toEqual({ name: "test" });
    });

    it("stores + retrieves a value under a class token", () => {
      class Foo {}
      const container = new TestContainer();
      const instance = { hello: "world" };
      container.provide(Foo, instance);

      expect(container.get(Foo)).toBe(instance);
    });

    it("overwrites on repeated .provide with the same token", () => {
      const TOKEN = Symbol("cache");
      const container = new TestContainer();
      container.provide(TOKEN, "first");
      container.provide(TOKEN, "second");

      expect(container.get(TOKEN)).toBe("second");
    });

    it("returns the value with the requested type parameter", () => {
      const TOKEN = Symbol("port");
      const container = new TestContainer();
      container.provide<number>(TOKEN, 8080);

      const port = container.get<number>(TOKEN);
      expect(port).toBe(8080);
      expect(typeof port).toBe("number");
    });
  });

  // ── .set (alias) ──────────────────────────────────────────────

  describe(".set (alias for .provide)", () => {
    it("behaves identically to .provide", () => {
      const TOKEN = Symbol("x");
      const container = new TestContainer();
      container.set(TOKEN, 42);

      expect(container.get(TOKEN)).toBe(42);
    });
  });

  // ── .get on missing token ─────────────────────────────────────

  describe(".get on missing token", () => {
    it("throws with the token name surfaced in the error", () => {
      const TOKEN = Symbol("missing_logger");
      const container = new TestContainer();
      expect(() => container.get(TOKEN)).toThrow(
        /No provider registered for token "Symbol\(missing_logger\)"/,
      );
    });

    it("suggests calling .provide in the error message", () => {
      const container = new TestContainer();
      expect(() => container.get(Symbol("x"))).toThrow(
        /Call \.provide\(token, value\) before requesting it/,
      );
    });

    it("names class-based tokens by class name", () => {
      class LoggerService {}
      const container = new TestContainer();
      expect(() => container.get(LoggerService)).toThrow(/"LoggerService"/);
    });

    it("labels anonymous class tokens as 'anonymous class'", () => {
      const anonymous = class {};
      const container = new TestContainer();
      // Named-class expressions still get a name at runtime — but a
      // truly anonymous constructor (e.g. `class {}` passed directly)
      // has `name === ""`, which the container labels for us.
      Object.defineProperty(anonymous, "name", { value: "" });
      expect(() => container.get(anonymous)).toThrow(/anonymous class/);
    });

    it("labels string tokens via String(...)", () => {
      const container = new TestContainer();
      expect(() => container.get("MY_TOKEN")).toThrow(/"MY_TOKEN"/);
    });
  });

  // ── .getOptional ──────────────────────────────────────────────

  describe(".getOptional", () => {
    it("returns undefined on a missing token", () => {
      const container = new TestContainer();
      expect(container.getOptional(Symbol("missing"))).toBeUndefined();
    });

    it("returns the value when the token is registered", () => {
      const TOKEN = Symbol("t");
      const container = new TestContainer();
      container.provide(TOKEN, "hello");

      expect(container.getOptional(TOKEN)).toBe("hello");
    });
  });

  // ── .has ─────────────────────────────────────────────────────

  describe(".has", () => {
    it("returns false when the token was never provided", () => {
      const container = new TestContainer();
      expect(container.has(Symbol("missing"))).toBe(false);
    });

    it("returns true once the token is provided", () => {
      const TOKEN = Symbol("t");
      const container = new TestContainer();
      container.provide(TOKEN, "hello");

      expect(container.has(TOKEN)).toBe(true);
    });

    it("returns true even when the value is undefined", () => {
      const TOKEN = Symbol("nullable");
      const container = new TestContainer();
      container.provide(TOKEN, undefined);

      expect(container.has(TOKEN)).toBe(true);
      expect(container.getOptional(TOKEN)).toBeUndefined();
    });
  });

  // ── .resolve ─────────────────────────────────────────────────

  describe(".resolve", () => {
    it("resolves to the same value .get would return", async () => {
      const TOKEN = Symbol("t");
      const container = new TestContainer();
      container.provide(TOKEN, { a: 1 });

      await expect(container.resolve(TOKEN)).resolves.toEqual({ a: 1 });
    });

    it("rejects with the same error .get would throw for a missing token", async () => {
      const container = new TestContainer();
      await expect(container.resolve(Symbol("missing"))).rejects.toThrow(
        /No provider registered/,
      );
    });
  });

  // ── .close ────────────────────────────────────────────────────

  describe(".close", () => {
    it("clears every registration", async () => {
      const TOKEN = Symbol("t");
      const container = new TestContainer();
      container.provide(TOKEN, "hello");
      await container.close();

      expect(container.has(TOKEN)).toBe(false);
      expect(container.registry.size).toBe(0);
    });

    it("returns a resolved promise", async () => {
      const container = new TestContainer();
      await expect(container.close()).resolves.toBeUndefined();
    });
  });

  // ── registry accessor ─────────────────────────────────────────

  describe(".registry", () => {
    it("exposes the backing Map for direct inspection", () => {
      const TOKEN = Symbol("t");
      const container = new TestContainer();
      container.provide(TOKEN, 1);

      expect(container.registry).toBeInstanceOf(Map);
      expect(container.registry.get(TOKEN)).toBe(1);
    });
  });
});

describe("createTestContainer", () => {
  it("returns a fresh ITestContainer", () => {
    const container: ITestContainer = createTestContainer();
    expect(container).toBeInstanceOf(TestContainer);
    expect(container.registry.size).toBe(0);
  });

  it("seeds every [token, value] pair from the argument iterable", () => {
    const A = Symbol("a");
    const B = Symbol("b");
    const container = createTestContainer([
      [A, "alpha"],
      [B, 42],
    ]);

    expect(container.get(A)).toBe("alpha");
    expect(container.get(B)).toBe(42);
  });

  it("accepts a Map as its iterable arg", () => {
    const TOKEN = Symbol("t");
    const initial = new Map<unknown, unknown>([[TOKEN, "seeded"]]);
    const container = createTestContainer(initial);

    expect(container.get(TOKEN)).toBe("seeded");
  });

  it("returns independent containers on separate calls", () => {
    const TOKEN = Symbol("t");
    const a = createTestContainer();
    const b = createTestContainer();
    a.provide(TOKEN, "in-a");

    expect(a.get(TOKEN)).toBe("in-a");
    expect(b.has(TOKEN)).toBe(false);
  });
});
