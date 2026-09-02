/** @file config.test.ts @description Gateway configuration validation tests. */
import { describe, expect, it } from "vitest";
import { loadGatewayConfig } from "../../src/config/gateway.config.js";

describe("loadGatewayConfig", () => {
  it("rejects incomplete configuration", () => {
    expect(() => loadGatewayConfig({})).toThrow(/Invalid Gateway configuration/);
  });
});
