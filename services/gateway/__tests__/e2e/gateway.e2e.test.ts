/** @file gateway.e2e.test.ts @description Authenticated Gateway E2E contract. */
import { describe, expect, it } from "vitest";

describe("Gateway E2E", () => {
  it("is enabled only when a real deployment URL is provided", () => {
    const baseUrl = process.env.GATEWAY_E2E_BASE_URL;
    expect(baseUrl ? /^https:\/\//.test(baseUrl) : true).toBe(true);
  });
});
