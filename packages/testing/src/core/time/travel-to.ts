/**
 * @file travel-to.ts
 * @module @stackra/testing/core/time
 * @description Move the fake clock to a specific instant. Automatically
 *   engages the fake clock when it isn't already frozen — no need to
 *   call `freezeTime()` first.
 */

import { vi } from "vitest";

import { freezeTime } from "./freeze-time";

/**
 * Move the fake clock to `when`.
 *
 * @param when - Target instant. Accepts an ISO string, a `Date`, or
 *   an epoch-ms number.
 *
 * @example
 * ```ts
 * freezeTime("2026-01-01T00:00:00Z");
 * // ...
 * travelTo("2026-01-01T00:05:00Z"); // 5 minutes later
 * ```
 */
export function travelTo(when: string | Date | number): void {
  freezeTime();
  vi.setSystemTime(when instanceof Date ? when : new Date(when));
}
