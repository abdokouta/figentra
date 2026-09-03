/**
 * @file restore-time.ts
 * @module @stackra/testing/core/time
 * @description Release the fake clock and return every timer + Date
 *   read to the real system clock. Idempotent — safe to call in an
 *   `afterEach` regardless of whether the test froze time.
 */

import { vi } from "vitest";

import { timeState } from "./time-state";

/**
 * Restore the real clock. No-op when the clock isn't frozen.
 *
 * @example
 * ```ts
 * import { restoreTime } from "@stackra/testing";
 *
 * afterEach(() => {
 *   restoreTime();
 * });
 * ```
 */
export function restoreTime(): void {
  if (timeState.frozen) {
    vi.useRealTimers();
    timeState.frozen = false;
  }
}
