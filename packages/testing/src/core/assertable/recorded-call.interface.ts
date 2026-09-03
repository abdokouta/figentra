/**
 * @file recorded-call.interface.ts
 * @module @stackra/testing/core/assertable
 * @description One row in an assertable proxy's call history.
 *
 *   Every method invocation on a proxy target lands here — the
 *   assertion API (`.$`) walks the history to answer questions like
 *   "was this method called?" or "what were its arguments?".
 */

/**
 * A single recorded invocation on a proxy target.
 *
 * Fields:
 *
 * - `method` — the property name the caller invoked.
 * - `args` — the argument list passed to the method (frozen).
 * - `result` — return value (or the thrown error when `threw` is true).
 * - `threw` — `true` when the underlying call threw or when a stub
 *   forced an error via `.$.throws(...)`.
 * - `timestamp` — `Date.now()` at the time of the call. Useful for
 *   `toHaveBeenCalledWithinLast(ms)` and time-based assertions.
 */
export interface IRecordedCall {
  readonly method: string;
  readonly args: readonly unknown[];
  readonly result: unknown;
  readonly threw: boolean;
  readonly timestamp: number;
}
