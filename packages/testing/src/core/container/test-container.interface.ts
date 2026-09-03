/**
 * @file test-container.interface.ts
 * @module @stackra/testing/core/container
 * @description Public interface of the workspace's minimal DI
 *   container for tests — a `Map`-backed token registry that
 *   mirrors the `IApplication` shape from `@stackra/contracts`
 *   (once contracts lands its Task-6 architecture).
 *
 *   Consumers use it as a lightweight fake for the production
 *   container — provide the tokens the unit under test needs, run
 *   the assertion, discard.
 */

/**
 * DI container-like surface for tests. Every method is
 * synchronous EXCEPT `resolve` (async parity with the production
 * container's async-init path).
 */
export interface ITestContainer {
  /**
   * Register `value` under `token`. Overwrites any existing
   * registration.
   */
  provide<T>(token: unknown, value: T): void;

  /**
   * Alias for `provide` — matches the `ApplicationBuilder.set()`
   * naming reviewers may already recognise.
   */
  set<T>(token: unknown, value: T): void;

  /**
   * Return the value registered under `token`. Throws a
   * descriptive error when the token is not registered — never
   * returns `undefined`.
   *
   * @throws `Error` when the token is unknown.
   */
  get<T = unknown>(token: unknown): T;

  /**
   * Return the value registered under `token`, or `undefined`
   * when the token is not registered. Non-throwing.
   */
  getOptional<T = unknown>(token: unknown): T | undefined;

  /** `true` when the token is registered (even to `undefined`). */
  has(token: unknown): boolean;

  /**
   * Async parity with the production container's
   * `.resolve(token)`. Returns the same value `.get()` would; the
   * promise wrapper is there so consumers can share the same call
   * shape between production and test code.
   */
  resolve<T = unknown>(token: unknown): Promise<T>;

  /**
   * Clear every registration. Parity with the production
   * container's `.close()` shutdown hook.
   */
  close(): Promise<void>;

  /** Direct access to the underlying token → value map. */
  readonly registry: Map<unknown, unknown>;
}
