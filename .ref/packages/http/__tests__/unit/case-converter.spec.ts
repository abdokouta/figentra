/**
 * @file case-converter.spec.ts
 * @module @stackra/http/__tests__/unit
 * @description Behavioural spec for `CaseConverter.toSnakeCase` and
 *   `CaseConverter.toCamelCase`.
 */

import { describe, expect, it } from "vitest";
import { CaseConverter } from "../../src/core/utils/case-converter.util";

describe("CaseConverter.toSnakeCase", () => {
  it("converts camelCase keys to snake_case", () => {
    expect(
      CaseConverter.toSnakeCase({ userName: "alice", accountId: 42 }),
    ).toEqual({
      user_name: "alice",
      account_id: 42,
    });
  });

  it("recurses into nested objects", () => {
    expect(
      CaseConverter.toSnakeCase({
        userProfile: { firstName: "Alice", lastName: "Anders" },
      }),
    ).toEqual({
      user_profile: { first_name: "Alice", last_name: "Anders" },
    });
  });

  it("recurses into arrays", () => {
    expect(CaseConverter.toSnakeCase([{ userId: 1 }, { userId: 2 }])).toEqual([
      { user_id: 1 },
      { user_id: 2 },
    ]);
  });

  it("passes through null / undefined / primitives", () => {
    expect(CaseConverter.toSnakeCase(null)).toBe(null);
    expect(CaseConverter.toSnakeCase(undefined)).toBeUndefined();
    expect(CaseConverter.toSnakeCase("hello")).toBe("hello");
    expect(CaseConverter.toSnakeCase(42)).toBe(42);
    expect(CaseConverter.toSnakeCase(true)).toBe(true);
  });

  it("preserves Date objects unchanged", () => {
    const date = new Date("2026-01-01T00:00:00Z");
    const result = CaseConverter.toSnakeCase({ createdAt: date });
    expect((result as { created_at: Date }).created_at).toBe(date);
  });
});

describe("CaseConverter.toCamelCase", () => {
  it("converts snake_case keys to camelCase", () => {
    expect(
      CaseConverter.toCamelCase({ user_name: "alice", account_id: 42 }),
    ).toEqual({
      userName: "alice",
      accountId: 42,
    });
  });

  it("recurses into nested objects", () => {
    expect(
      CaseConverter.toCamelCase({
        user_profile: { first_name: "Alice", last_name: "Anders" },
      }),
    ).toEqual({
      userProfile: { firstName: "Alice", lastName: "Anders" },
    });
  });

  it("recurses into arrays", () => {
    expect(CaseConverter.toCamelCase([{ user_id: 1 }, { user_id: 2 }])).toEqual(
      [{ userId: 1 }, { userId: 2 }],
    );
  });

  it("is the inverse of toSnakeCase for a simple object", () => {
    const original = { userName: "alice", accountId: 42 };
    const roundtrip = CaseConverter.toCamelCase(
      CaseConverter.toSnakeCase(original),
    );
    expect(roundtrip).toEqual(original);
  });
});
