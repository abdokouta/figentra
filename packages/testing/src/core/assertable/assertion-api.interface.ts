/**
 * @file assertion-api.interface.ts
 * @module @stackra/testing/core/assertable
 * @description Public assertion surface accessible via the `.$`
 *   accessor on every assertable proxy.
 *
 *   Kept separate from the proxy factory so consumers can type
 *   variables that hold ONLY the assertion API (rare — but useful
 *   when a helper receives the accessor by reference).
 *
 *   The API exists in two shapes at every call site:
 *
 *   - Fluent (`mock.$.wasCalled("get")`) — the canonical modern form.
 *   - Legacy shortcuts on the proxy itself
 *     (`mock.assertCalled("get")`) — preserved for the older
 *     `.ref/` consumers that predate the `.$` split.
 *
 *   Both shapes read + write the SAME underlying history. Reset via
 *   `mock.$.reset()` OR `mock.reset()` — either wipes both surfaces.
 */

import type { IRecordedCall } from "./recorded-call.interface";

/**
 * Assertion surface for an assertable proxy. Accessed via the `.$`
 * property on the proxy — never instantiated directly.
 *
 * Every method operates on the SAME history the proxy records.
 * Return types are documented per member; missing entries never
 * throw, so consumers can chain `.wasCalled` checks freely.
 */
export interface IAssertionApi {
  /** Total number of recorded calls across every method. */
  totalCalls(): number;

  /** `true` when `method` was invoked at least once. */
  wasCalled(method: string): boolean;

  /**
   * `true` when `method` was called with an argument list that
   * deep-equals `args`.
   *
   * @param method - The property name (e.g. `"get"`).
   * @param args - The expected argument list.
   */
  wasCalledWith(method: string, args: readonly unknown[]): boolean;

  /** Number of times `method` was called. `0` when never called. */
  callCount(method: string): number;

  /**
   * Every argument list `method` was called with, in call order.
   *
   * Returns a fresh array each call; safe to `.map` / `.forEach`.
   */
  calls(method: string): readonly (readonly unknown[])[];

  /**
   * Complete recorded-call history across every method, in call
   * order.
   *
   * Returns a fresh array each call.
   */
  history(): readonly IRecordedCall[];

  /**
   * Wipe every recorded call, stub, and pending error. The proxy
   * behaves as if just created.
   */
  reset(): void;

  /**
   * Stub the return value of `method`. Subsequent invocations
   * bypass the underlying target and return the stubbed value.
   *
   * When `value` is a function, it's invoked with the call's
   * argument list and its return becomes the stub result. When
   * `value` is not a function, it's returned verbatim.
   *
   * @param method - The property name to stub.
   * @param value - The stub value or factory function.
   */
  returns(method: string, value: unknown): void;

  /**
   * Clear a stub previously registered via `returns(method, ...)`.
   * Subsequent invocations call the underlying target normally.
   */
  clearReturn(method: string): void;

  /**
   * Force `method` to throw the given error on its next invocation.
   * The error fires ONCE per registration — clears after the first
   * throw so subsequent calls behave normally (or against a stub).
   */
  throws(method: string, error: Error): void;

  /**
   * Wait until `method` has been called `count` times (default 1).
   * Resolves as soon as the count is reached. Rejects after
   * `timeoutMs` (default 1000 ms) with a descriptive error.
   *
   * Useful for async side-effect assertions: fire an event, then
   * `await mock.$.until("handleEvent")` before asserting.
   */
  until(method: string, count?: number, timeoutMs?: number): Promise<void>;
}
