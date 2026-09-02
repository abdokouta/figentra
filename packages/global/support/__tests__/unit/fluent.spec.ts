/**
 * @file fluent.spec.ts
 * @module @stackra/support/__tests__/unit
 */

import { describe, expect, it } from "vitest";

import { Fluent } from "../../src/fluent";

describe("Fluent", () => {
  it("get returns the attribute value", () => {
    const f = new Fluent({ host: "localhost", port: 3000 });
    expect(f.get("host")).toBe("localhost");
    expect(f.get("port")).toBe(3000);
  });

  it("set updates the attribute and returns this for chaining", () => {
    const f = new Fluent({ host: "localhost", port: 3000 });
    f.set("host", "example.com").set("port", 8080);
    expect(f.get("host")).toBe("example.com");
    expect(f.get("port")).toBe(8080);
  });

  it("has returns true for defined attributes", () => {
    const f = new Fluent({ x: 1, y: undefined });
    expect(f.has("x")).toBe(true);
    // y is defined as undefined so has returns false per the impl.
    expect(f.has("y")).toBe(false);
  });

  it("toObject returns a shallow copy of the attributes", () => {
    const f = new Fluent({ a: 1, b: 2 });
    const obj = f.toObject();
    expect(obj).toEqual({ a: 1, b: 2 });
    // Mutating the returned object does not affect the internal state.
    obj.a = 999;
    expect(f.get("a")).toBe(1);
  });

  it("make() returns a proxy that supports direct property access", () => {
    const f = Fluent.make({ host: "localhost", port: 3000 });
    expect(f.host).toBe("localhost");
    expect(f.port).toBe(3000);
  });

  it("make() proxy supports property assignment via set()", () => {
    const f = Fluent.make({ host: "localhost", port: 3000 });
    f.host = "example.com";
    expect(f.get("host")).toBe("example.com");
    expect(f.host).toBe("example.com");
  });

  it("make() proxy still exposes typed methods", () => {
    const f = Fluent.make({ host: "localhost" });
    expect(f.has("host")).toBe(true);
    expect(f.toObject()).toEqual({ host: "localhost" });
  });
});
