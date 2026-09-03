/**
 * @file index.ts
 * @module @stackra/testing/core/time
 * @description Public API barrel for the time-control category.
 *
 *   `time-state.ts` is intentionally NOT re-exported — it's a
 *   package-private mutable flag consumed by the four public
 *   helpers below. Exposing it would let call sites toggle the
 *   frozen state without going through the helpers, breaking the
 *   Vitest fake-timer lifecycle contract.
 */

export { freezeTime } from "./freeze-time";
export { now } from "./now";
export { restoreTime } from "./restore-time";
export { travelBy } from "./travel-by";
export { travelTo } from "./travel-to";
