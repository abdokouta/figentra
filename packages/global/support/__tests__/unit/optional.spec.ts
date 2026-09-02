/**
 * @file optional.spec.ts
 * @module @stackra/support/__tests__/unit
 * @description Behavioural spec for the `optional(value)` proxy.
 */

import { describe, expect, it } from "vitest";
import { optional } from "../../src/utils/optional.util";

describe("optional", () => {
  it("returns the value unchanged when it exists", () => {
    const user = { name: "Alice", role: "admin" };
    const wrapped = optional(user);
    expect(wrapped).toBe(user);
    expect(wrapped.name).toBe("Alice");
    expect(wrapped.role).toBe("admin");
  });

  it("returns a proxy for null that yields undefined on any property access", () => {
    const wrapped = optional<{ name: string; role: string }>(null);
    expect(wrapped.name).toBeUndefined();
    expect(wrapped.role).toBeUndefined();
  });

  it("returns a proxy for undefined that yields undefined on any property access", () => {
    const wrapped = optional<{ id: string }>(undefined);
    expect(wrapped.id).toBeUndefined();
  });

  it("proxy returns undefined for arbitrary keys without throwing", () => {
    const wrapped = optional<Record<string, unknown>>(null);
    // Every key returns undefined — including keys the caller never
    // declared in the type parameter.
    expect(wrapped["nested"]).toBeUndefined();
    expect(wrapped["arr"]).toBeUndefined();
  });

  it("value-form supports chaining into optional nested access", () => {
    // The wrapped value keeps its full shape; optional-chaining (?.)
    // still works for genuinely-nested optional fields.
    const user = { profile: { city: "Sydney" } };
    const wrapped = optional(user);
    expect(wrapped.profile?.city).toBe("Sydney");
  });
});
