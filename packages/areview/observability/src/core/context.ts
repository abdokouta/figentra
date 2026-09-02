/**
 * @file context.ts
 * @description Framework-neutral telemetry context helpers.
 */
import type { TelemetryContext } from "../contracts/telemetry-context.interface.js";

/**
 * Creates a trusted initial telemetry context.
 *
 * @param requestId - Request identifier from the trusted ingress boundary.
 * @param correlationId - Optional logical-operation identifier.
 * @returns Normalized telemetry context.
 */
export function createTelemetryContext(
  requestId: string,
  correlationId = requestId,
): TelemetryContext {
  return { requestId, correlationId };
}
