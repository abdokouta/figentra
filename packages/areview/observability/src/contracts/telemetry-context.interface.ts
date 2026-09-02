/**
 * @file telemetry-context.interface.ts
 * @description Distributed telemetry context shared across HTTP, RPC, workers, and events.
 */

/**
 * Carries identifiers required to correlate one execution across platform boundaries.
 */
export interface TelemetryContext {
  /** Stable request identifier generated at the first trusted boundary. */
  readonly requestId: string;
  /** Correlation identifier shared by one logical business operation. */
  readonly correlationId: string;
  /** W3C-compatible distributed trace identifier when available. */
  readonly traceId?: string;
  /** Current span identifier when available. */
  readonly spanId?: string;
}
