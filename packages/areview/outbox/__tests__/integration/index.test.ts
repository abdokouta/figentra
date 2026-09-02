/**
 * @file index.test.ts
 * @description Unit tests for outbox retry semantics and event validation.
 */
import { describe, expect, it } from "vitest";
import { outboxEventSchema, retryDelay } from "../src/index";

describe("outbox", () => {
  it("uses bounded exponential retry delays", () => {
    expect(retryDelay(1)).toBe(500);
    expect(retryDelay(2)).toBe(1000);
    expect(retryDelay(20)).toBe(300000);
  });

  it("rejects incomplete event records", () => {
    expect(() => outboxEventSchema.parse({ id: "x" })).toThrow();
  });
});
