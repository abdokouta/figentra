/**
 * @file index.ts
 * @description Test helpers for observability contracts.
 */
import type { TelemetryContext } from "../contracts/telemetry-context.interface.js";

/**
 * Creates deterministic telemetry context data for unit and integration tests.
 *
 * @param overrides - Optional test-specific identifiers.
 * @returns Stable telemetry context fixture.
 */
export function createTelemetryFixture(
  overrides: Partial<TelemetryContext> = {},
): TelemetryContext {
  return {
    requestId: "test-request",
    correlationId: "test-correlation",
    ...overrides,
  };
}
