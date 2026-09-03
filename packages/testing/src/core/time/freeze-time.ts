/**
 * @file freeze-time.ts
 * @module @stackra/testing/core/time
 * @description Engage Vitest's fake-timer machinery. Every subsequent
 *   `new Date()` / `Date.now()` / `setTimeout` / `setInterval` reads
 *   the fake clock the caller controls via `travelTo` / `travelBy`.
 *
 *   Idempotent — repeated calls are safe. Pair with `restoreTime()`
 *   in `afterEach` (or use the `/setup` subpath which registers a
 *   global cleanup).
 */

import { vi } from "vitest";

import { timeState } from "./time-state";

/**
 * Freeze the clock. Optionally set a specific starting instant.
 *
 * @param when - Anchor for the fake clock. When omitted, keeps the
 *   current real-time instant as the frozen anchor. Accepts an ISO
 *   string, a `Date`, or an epoch-ms number.
 *
 * @example
 * ```ts
 * import { freezeTime, travelTo, restoreTime } from "@stackra/testing";
 *
 * beforeEach(() => {
 *   freezeTime("2026-01-01T00:00:00Z");
 * });
 *
 * afterEach(() => {
 *   restoreTime();
 * });
 * ```
 */
export function freezeTime(when?: string | Date | number): void {
  if (!timeState.frozen) {
    vi.useFakeTimers();
    timeState.frozen = true;
  }
  if (when !== undefined) {
    vi.setSystemTime(when instanceof Date ? when : new Date(when));
  }
}
