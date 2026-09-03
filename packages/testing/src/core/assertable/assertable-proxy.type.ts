/**
 * @file assertable-proxy.type.ts
 * @module @stackra/testing/core/assertable
 * @description Public type of the value returned by
 *   `createAssertableProxy(target)`.
 *
 *   Composes the target's own shape with the assertion surface
 *   (`.$`) plus legacy `.assert*` / `.getCalls` / `.reset`
 *   shortcuts. Keeps every call-site type-safe — TypeScript still
 *   sees `mock.doSomething("arg")` as the original method.
 */

import type { IAssertionApi } from "./assertion-api.interface";

/**
 * The type a proxy target picks up after `createAssertableProxy`
 * wraps it.
 *
 * Composed as `T & { $: IAssertionApi } & LegacyShortcuts` so
 * every original method is preserved; the assertion surface lives
 * on `.$` and duplicated shortcuts hang off the proxy itself.
 */
export type AssertableProxy<T> = T & {
  /** Modern fluent assertion API. */
  readonly $: IAssertionApi;

  /**
   * Legacy shortcut — throws when `method` was never called.
   * Prefer `mock.$.wasCalled(method)` in new code.
   */
  assertCalled(method: keyof T | string): void;

  /**
   * Legacy shortcut — throws when `method` was never called with
   * the given arg list. Prefer
   * `mock.$.wasCalledWith(method, [...args])` in new code.
   */
  assertCalledWith(method: keyof T | string, ...args: unknown[]): void;

  /** Legacy shortcut — throws when `method` was ever called. */
  assertNotCalled(method: keyof T | string): void;

  /**
   * Legacy shortcut — arrays of arg-lists for `method`.
   * Prefer `mock.$.calls(method)` in new code.
   */
  getCalls(method: keyof T | string): readonly (readonly unknown[])[];

  /**
   * Legacy shortcut — wipes recorded calls, stubs, and pending
   * errors. Prefer `mock.$.reset()` in new code.
   */
  reset(): void;
};
