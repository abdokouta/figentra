/**
 * @file now.ts
 * @module @stackra/testing/core/time
 * @description Return the current test-time instant. Reads the fake
 *   clock when frozen, the real clock otherwise. Prefer this over
 *   `new Date()` inside test helpers so the same helper is safe to
 *   call before and after `freezeTime()`.
 */

/**
 * Current instant — reflects the fake clock when it's engaged.
 *
 * @example
 * ```ts
 * freezeTime("2026-06-15T12:00:00Z");
 * now(); // Date corresponding to 2026-06-15T12:00:00Z
 * ```
 */
export function now(): Date {
  return new Date();
}
