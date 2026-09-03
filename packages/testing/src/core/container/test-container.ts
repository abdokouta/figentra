/**
 * @file test-container.ts
 * @module @stackra/testing/core/container
 * @description In-memory implementation of `ITestContainer`. Mirrors
 *   the production container's public surface (`.get` / `.getOptional`
 *   / `.has` / `.resolve` / `.close`) so consumers can register the
 *   container under `APPLICATION` (or the equivalent contract token)
 *   in tests without a fake.
 *
 *   Backed by a plain `Map<unknown, unknown>` — tokens are compared
 *   by reference identity, which matches how DI containers resolve.
 */

import type { ITestContainer } from "./test-container.interface";

/**
 * Minimal DI container for tests.
 *
 * @example
 * ```ts
 * const container = new TestContainer();
 * container.provide(LOGGER_MANAGER, createMockLogger());
 * const logger = container.get<ILoggerManager>(LOGGER_MANAGER);
 * ```
 */
export class TestContainer implements ITestContainer {
  public readonly registry: Map<unknown, unknown>;

  public constructor(initial?: Iterable<readonly [unknown, unknown]>) {
    this.registry = new Map<unknown, unknown>(
      initial as Iterable<[unknown, unknown]> | undefined,
    );
  }

  public provide<T>(token: unknown, value: T): void {
    this.registry.set(token, value);
  }

  public set<T>(token: unknown, value: T): void {
    this.provide(token, value);
  }

  public get<T = unknown>(token: unknown): T {
    if (!this.registry.has(token)) {
      throw new Error(
        `[TestContainer] No provider registered for token "${this.describe(token)}". ` +
          "Call .provide(token, value) before requesting it.",
      );
    }
    return this.registry.get(token) as T;
  }

  public getOptional<T = unknown>(token: unknown): T | undefined {
    return this.registry.get(token) as T | undefined;
  }

  public has(token: unknown): boolean {
    return this.registry.has(token);
  }

  public async resolve<T = unknown>(token: unknown): Promise<T> {
    // `async` intentional — converts the synchronous throw from
    // `.get(token)` on a missing token into a promise rejection, so
    // callers can `await expect(...).rejects.toThrow(...)`.
    return this.get<T>(token);
  }

  public close(): Promise<void> {
    this.registry.clear();
    return Promise.resolve();
  }

  /**
   * Human-readable label for a token — used in error messages.
   * Symbols surface as `Symbol(description)`, classes as their `.name`,
   * everything else via `String(...)`.
   */
  private describe(token: unknown): string {
    if (typeof token === "symbol") return token.toString();
    if (typeof token === "function") return token.name || "anonymous class";
    return String(token);
  }
}
