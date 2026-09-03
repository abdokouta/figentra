/**
 * @file time-state.ts
 * @module @stackra/testing/core/time
 * @description Module-local state tracking whether the fake clock is
 *   engaged. Kept out of the public barrel — every consumer flips
 *   the switch via `freezeTime()` / `travelTo()` / `restoreTime()`.
 *
 *   Vitest's `vi.useFakeTimers()` is idempotent; calling it twice is
 *   harmless. We still track the flag so `restoreTime()` can no-op
 *   when the clock is already real, and `now()` can decide which
 *   Date to hand back.
 */

/**
 * Internal state — mutated by `freezeTime` / `restoreTime`.
 * NEVER exported from the public barrel.
 */
export const timeState = {
  /** `true` when `vi.useFakeTimers()` has been called and not yet undone. */
  frozen: false as boolean,
};
