/**
 * @file log-entry.interface.ts
 * @description Canonical structured log fields shared by platform runtimes.
 */

import type { TelemetryContext } from "./telemetry-context.interface.js";

/**
 * Minimum structured fields expected from platform application logs.
 */
export interface LogEntry extends Partial<TelemetryContext> {
  /** Stable service identifier. */
  readonly serviceId: string;
  /** Runtime environment. */
  readonly environment: "development" | "staging" | "production";
  /** Human-readable event message. */
  readonly message: string;
  /** Optional actor identifier when a trusted identity context exists. */
  readonly actorId?: string;
  /** Optional tenant identifier when a trusted tenancy context exists. */
  readonly tenantId?: string;
}
