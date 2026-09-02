/**
 * @file base-registry.spec.ts
 * @module @stackra/support/__tests__/unit
 */

import { describe, expect, it } from "vitest";

import { BaseRegistry } from "../../src/registries/base.registry";

class TestRegistry extends BaseRegistry<string, { name: string }> {}

describe("BaseRegistry", () => {
  it("register + get round-trips a value", () => {
    const registry = new TestRegistry();
    registry.register("a", { name: "Alpha" });
    expect(registry.get("a")?.name).toBe("Alpha");
  });

  it("register throws on duplicate key by default", () => {
    const registry = new TestRegistry();
    registry.register("a", { name: "Alpha" });
    expect(() => registry.register("a", { name: "Alpha2" })).toThrow();
  });

  it("replace overwrites without throwing", () => {
    const registry = new TestRegistry();
    registry.register("a", { name: "Alpha" });
    registry.replace("a", { name: "Alpha2" });
    expect(registry.get("a")?.name).toBe("Alpha2");
  });

  it("has returns true for registered keys", () => {
    const registry = new TestRegistry();
    registry.register("a", { name: "Alpha" });
    expect(registry.has("a")).toBe(true);
    expect(registry.has("b")).toBe(false);
  });

  it("values returns all registered values", () => {
    const registry = new TestRegistry();
    registry.register("a", { name: "Alpha" });
    registry.register("b", { name: "Beta" });
    const values = registry.values();
    expect(values.length).toBe(2);
    expect(values.map((v) => v.name)).toContain("Alpha");
    expect(values.map((v) => v.name)).toContain("Beta");
  });
});
