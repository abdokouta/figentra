/**
 * @file assertable-proxy.type.ts
 * @module @stackra/contracts/types
 * @description Cross-package `AssertableProxy<T>` type.
 *
 *   Promoted from `@stackra/testing/core/assertable-proxy.ts` per
 *   `.kiro/steering/contracts-and-decorators-promotion.md` — DEF-02 in
 *   the frontend-final-production-review-remediation plan. Consumer
 *   count crossed the 25-package threshold long ago; every workspace
 *   `testing/create-mock-*.ts` file that wraps a service in
 *   `createAssertableProxy(...)` typed the return with this shape.
 *
 *   The runtime `createAssertableProxy(...)` + `Assertable` bookkeeper
 *   stay in `@stackra/testing` — this file promotes ONLY the shape so
 *   consumer packages can type their mock factories without pulling
 *   `@stackra/testing` into their runtime peer set.
 *
 * @typeParam T - The wrapped object's type.
 */

/**
 * Minimal shape of the `Assertable` bookkeeper exposed via `mock.$`.
 * The runtime lives in `@stackra/testing`; consumers only need the
 * public assertion surface.
 */
export interface IAssertable {
  /**
   * Whether a method was called with the given args.
   *
   * @param method - Method name.
   * @param args - Expected args.
   */
  wasCalledWith(method: string, ...args: readonly unknown[]): boolean;

  /**
   * Whether a method was called at all (regardless of args).
   *
   * @param method - Method name.
   */
  wasCalled(method: string): boolean;

  /**
   * How many times a method was called.
   *
   * @param method - Method name.
   */
  callCount(method: string): number;

  /**
   * Recorded call history for a method — every args array + returnValue
   * + error tuple.
   *
   * @param method - Method name.
   */
  callsFor(method: string): ReadonlyArray<{
    args: readonly unknown[];
    returnValue?: unknown;
    error?: unknown;
  }>;

  /**
   * Reset the bookkeeper's recorded history (does NOT clear stubs).
   */
  reset(): void;
}

/**
 * A proxied object with the same public API as `T`, plus a `$`
 * accessor exposing the `IAssertable` bookkeeper for assertions.
 *
 * @example
 * ```ts
 * import type { AssertableProxy } from '@stackra/contracts';
 *
 * function createMockUserService(): AssertableProxy<UserService> {
 *   return createAssertableProxy(new UserService());
 * }
 * ```
 */
export type AssertableProxy<T extends object> = T & { readonly $: IAssertable };
