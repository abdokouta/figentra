/**
 * @file coordinator.error.ts
 * @module @stackra/coordinator/core/errors
 * @description Error class for coordinator operations (lock timeouts, election failures).
 */

import { StackraError } from "@stackra/support";
/**
 * Error thrown by the coordinator system.
 *
 * Codes: `LOCK_TIMEOUT`, `ELECTION_FAILED`, `CHANNEL_UNAVAILABLE`
 */
export class CoordinatorError extends StackraError {
  public readonly details?: Record<string, unknown>;

  public constructor(
    message: string,
    code: string = "COORDINATOR_ERROR",
    details?: Record<string, unknown>,
  ) {
    super(message, code);
    this.details = details;
  }
}
