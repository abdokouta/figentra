/**
 * @file create-assertable-proxy.ts
 * @module @stackra/testing/core/assertable
 * @description The workspace's canonical mock factory — wraps a real
 *   instance in a `Proxy` that records every method invocation and
 *   exposes both the modern `.$` assertion API and the legacy
 *   `.assertCalled` / `.assertCalledWith` / `.getCalls` shortcuts.
 *
 *   Design goals:
 *
 *   - Zero-config for consumers: `createAssertableProxy(new Foo())`.
 *   - The target is a REAL instance — every method still executes
 *     normally, so the mock behaves like production code by default.
 *   - Stubs (`.$.returns`) and forced errors (`.$.throws`) let tests
 *     override behaviour when needed.
 *   - History is timestamped so time-window assertions work.
 *   - `.$.until(method)` provides async wait for eventual-consistency
 *     tests.
 */

import { isDeepStrictEqual } from "node:util";

import type { IAssertionApi } from "./assertion-api.interface";
import type { AssertableProxy } from "./assertable-proxy.type";
import type { IRecordedCall } from "./recorded-call.interface";

/**
 * Sentinel used to detect a stub set to `undefined` explicitly.
 * `stubs.get(method)` returns `undefined` for BOTH "not set" and
 * "set to undefined"; distinguishing the two matters when the
 * consumer wants to force a `void`-returning stub.
 */
const NOT_STUBBED = Symbol("NOT_STUBBED");

/**
 * Wrap `target` in an assertable proxy. Every method invocation is
 * recorded; the return value is either the underlying method's
 * result OR a stub set via `.$.returns(method, value)`.
 *
 * Property accesses that are NOT functions pass through unmodified;
 * assertions only apply to method calls.
 *
 * @param target - Any object; typically a fresh in-memory
 *   implementation of a service (see `packages/logger/src/testing`).
 * @returns The target's public shape plus `.$` + legacy shortcuts.
 *
 * @example
 * ```ts
 * class MockCache {
 *   private store = new Map<string, unknown>();
 *   set(key: string, value: unknown) { this.store.set(key, value); }
 *   get(key: string) { return this.store.get(key); }
 * }
 *
 * const cache = createAssertableProxy(new MockCache());
 * cache.set("user:1", { name: "Ada" });
 * cache.get("user:1");
 *
 * cache.$.wasCalled("set");                          // true
 * cache.$.wasCalledWith("set", ["user:1", { name: "Ada" }]); // true
 * cache.$.callCount("get");                          // 1
 * ```
 */
export function createAssertableProxy<T extends object>(
  target: T,
): AssertableProxy<T> {
  const history: IRecordedCall[] = [];
  const stubs = new Map<string, (...args: unknown[]) => unknown>();
  const pendingErrors = new Map<string, Error>();

  const api: IAssertionApi = {
    totalCalls: () => history.length,
    wasCalled: (method) => history.some((call) => call.method === method),
    wasCalledWith: (method, args) =>
      history.some(
        (call) =>
          call.method === method && isDeepStrictEqual(call.args, args),
      ),
    callCount: (method) =>
      history.reduce(
        (count, call) => count + (call.method === method ? 1 : 0),
        0,
      ),
    calls: (method) =>
      history
        .filter((call) => call.method === method)
        .map((call) => call.args),
    history: () => history.slice(),
    reset: () => {
      history.length = 0;
      stubs.clear();
      pendingErrors.clear();
    },
    returns: (method, value) => {
      const factory =
        typeof value === "function"
          ? (value as (...args: unknown[]) => unknown)
          : () => value;
      stubs.set(method, factory);
    },
    clearReturn: (method) => {
      stubs.delete(method);
    },
    throws: (method, error) => {
      pendingErrors.set(method, error);
    },
    until: async (method, count = 1, timeoutMs = 1000) => {
      const start = Date.now();
      const interval = 5;
      while (api.callCount(method) < count) {
        if (Date.now() - start > timeoutMs) {
          throw new Error(
            `[assertable] Timed out waiting for '${method}' to be called ` +
              `${count} time(s); last count = ${api.callCount(method)}.`,
          );
        }
        await new Promise((resolve) => setTimeout(resolve, interval));
      }
    },
  };

  // Legacy shortcuts hang off the proxy itself. They read/write the
  // SAME history + stubs above, so `mock.reset()` and `mock.$.reset()`
  // are indistinguishable.
  const legacyShortcuts: Record<string, unknown> = {
    assertCalled(method: string) {
      if (!api.wasCalled(method)) {
        throw new Error(
          `[assertable] Expected '${method}' to have been called, ` +
            `but it was never invoked.`,
        );
      }
    },
    assertCalledWith(method: string, ...args: unknown[]) {
      if (!api.wasCalledWith(method, args)) {
        throw new Error(
          `[assertable] Expected '${method}' to have been called with ` +
            `${JSON.stringify(args)}, but no matching call was found. ` +
            `Recorded calls: ${JSON.stringify(api.calls(method))}.`,
        );
      }
    },
    assertNotCalled(method: string) {
      if (api.wasCalled(method)) {
        throw new Error(
          `[assertable] Expected '${method}' NOT to have been called, ` +
            `but it was invoked ${api.callCount(method)} time(s).`,
        );
      }
    },
    getCalls(method: string) {
      return api.calls(method);
    },
    reset() {
      api.reset();
    },
  };

  return new Proxy(target, {
    get(obj, property, receiver): unknown {
      // Modern assertion accessor.
      if (property === "$") return api;

      // Legacy shortcuts land here first — the target class may not
      // define them, so returning early preserves the assertion
      // methods without shadowing real target methods.
      if (property in legacyShortcuts && !(property in obj)) {
        return legacyShortcuts[property as string];
      }

      const original = Reflect.get(obj, property, receiver);
      if (typeof original !== "function") return original;

      const methodName = String(property);

      // Wrap the method so every call is recorded.
      return function wrapped(this: unknown, ...args: unknown[]): unknown {
        const timestamp = Date.now();

        // Pending forced error — throws once, then clears.
        const err = pendingErrors.get(methodName);
        if (err !== undefined) {
          pendingErrors.delete(methodName);
          history.push({
            method: methodName,
            args: Object.freeze(args),
            result: err,
            threw: true,
            timestamp,
          });
          throw err;
        }

        const stub = stubs.get(methodName);
        try {
          const result: unknown = stub
            ? stub.apply(obj, args)
            : (original as (...a: unknown[]) => unknown).apply(obj, args);
          history.push({
            method: methodName,
            args: Object.freeze(args),
            result,
            threw: false,
            timestamp,
          });
          return result;
        } catch (thrown) {
          history.push({
            method: methodName,
            args: Object.freeze(args),
            result: thrown,
            threw: true,
            timestamp,
          });
          throw thrown;
        }
      };
    },
  }) as AssertableProxy<T>;
}

/** Internal sentinel export — never re-exported publicly. */
export { NOT_STUBBED };
