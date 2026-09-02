/**
 * @file observability.test.ts
 * @description Contract tests for framework-neutral telemetry primitives.
 */
import { describe, expect, it } from "vitest";
import { createTelemetryContext } from "../src/core/context.js";
import { createTelemetryFixture } from "../src/testing/index.js";

/**
 * Verifies deterministic telemetry context construction.
 */
describe("observability contracts", () => {
  it("creates a correlation context", () => {
    expect(createTelemetryContext("req-1")).toEqual({
      requestId: "req-1",
      correlationId: "req-1",
    });
  });

  it("creates a deterministic test fixture", () => {
    expect(createTelemetryFixture()).toEqual({
      requestId: "test-request",
      correlationId: "test-correlation",
    });
  });
});
