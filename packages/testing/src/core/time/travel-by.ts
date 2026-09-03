/**
 * @file travel-by.ts
 * @module @stackra/testing/core/time
 * @description Advance the fake clock by a relative millisecond
 *   offset. Prefer this over `travelTo(Date.now() + ms)` — one call,
 *   no arithmetic, always resolves against the current fake instant.
 */

import { vi } from "vitest";

import { freezeTime } from "./freeze-time";

/**
 * Advance the fake clock by `ms` milliseconds. Negative values move
 * backwards. Automatically engages the fake clock when not frozen.
 *
 * @param ms - Milliseconds to advance (or reverse when negative).
 *
 * @example
 * ```ts
 * freezeTime("2026-01-01T00:00:00Z");
 * travelBy(60_000);          // one minute forward
 * travelBy(-30_000);         // 30 seconds back
 * travelBy(24 * 60 * 60_000); // one day forward
 * ```
 */
export function travelBy(ms: number): void {
  freezeTime();
  vi.setSystemTime(new Date(Date.now() + ms));
}
