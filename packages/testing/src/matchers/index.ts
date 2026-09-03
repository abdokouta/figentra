/**
 * @file index.ts
 * @module @stackra/testing/matchers
 * @description Custom Vitest matchers that extend `expect()` with
 *   workspace-specific assertions.
 *
 *   Consumers call `registerAllMatchers()` once at test-suite boot
 *   (or `import "@stackra/testing/setup"` — which registers every
 *   matcher automatically). Individual matcher functions are also
 *   exported for consumers who want fine-grained control.
 *
 *   Matchers ship type augmentation via a global `interface`
 *   declaration merged into Vitest's `Assertion<T>` — TypeScript
 *   sees `expect(x).toBeUlid()` after the module is imported.
 */

import { expect, type MatcherState } from "vitest";

import type { AssertableProxy } from "../core/assertable/assertable-proxy.type";
import type { IRecordedCall } from "../core/assertable/recorded-call.interface";

// ─── Type augmentation ──────────────────────────────────────────────
//
// Vitest 4 uses a Chai-based `Assertion<T>` interface. Declaring the
// matchers on it here means `expect(x).toBeUlid()` is fully typed at
// every call site that imports this module (or `/setup`).

/**
 * Vitest augmentation — every custom matcher declared here becomes
 * available on `expect(x).*` at every call site.
 */
/**
 * Custom matcher shape shared between the async + async assertion
 * interfaces. Every matcher returns `void` (mutates `this` +
 * throws on fail); consumers chain via `.not.` / `.rejects.` on the
 * base Vitest surface.
 */
interface IStackraMatchers<R = unknown> {
  /**
   * Assert the value is a well-formed ULID (26 characters,
   * Crockford base32, first character in `[0-7]`).
   */
  toBeUlid(): R;

  /**
   * Assert the value satisfies the given Zod (or Zod-compatible)
   * schema.
   *
   * @param schema - Any object with a `.safeParse(value)`
   *   returning `{ success: boolean; error?: unknown }`.
   */
  toMatchZodSchema(schema: {
    safeParse: (value: unknown) => { success: boolean; error?: unknown };
  }): R;

  /**
   * Assert an assertable proxy's `method` was called within the
   * last `ms` milliseconds (relative to now).
   */
  toHaveBeenCalledWithinLast(method: string, ms: number): R;
}

// NOTE — the base `Assertion<T>` interface in `@vitest/expect` v4
// declares `<T = any>`. TS2428 requires our augmentation to use the
// same default. `AsymmetricMatchersContaining` declares no type
// parameter in the base — we supply the argument `unknown` on the
// extends clause instead.
declare module "vitest" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
  interface Assertion<T = any> extends IStackraMatchers<T> {}

  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface AsymmetricMatchersContaining extends IStackraMatchers<unknown> {}
}

// ─── Matcher implementations ────────────────────────────────────────
//
// Each matcher receives `this: MatcherState` (Vitest's Chai-shaped
// context) and returns `{ pass, message }`. Vitest inverts `pass`
// automatically for `.not` — the message helper reads it from
// `this.isNot`.

/**
 * Crockford base32 alphabet used by ULID. The first character is
 * restricted to `[0-7]` because a ULID's time component maxes out at
 * 48 bits; the leading nibble is always ≤ 7.
 */
const ULID_PATTERN = /^[0-7][0-9A-HJKMNP-TV-Z]{25}$/;

interface MatcherResult {
  pass: boolean;
  message: () => string;
  actual?: unknown;
  expected?: unknown;
}

/**
 * `toBeUlid` — assert `received` is a valid ULID string.
 */
export function toBeUlid(this: MatcherState, received: unknown): MatcherResult {
  const isString = typeof received === "string";
  const pass = isString && ULID_PATTERN.test(received);
  return {
    pass,
    actual: received,
    expected: "a valid ULID (26 chars, Crockford base32, first char in [0-7])",
    message: () =>
      this.isNot
        ? `expected ${JSON.stringify(received)} NOT to be a ULID`
        : `expected ${JSON.stringify(received)} to be a valid ULID`,
  };
}

/**
 * `toMatchZodSchema` — assert `received` satisfies `schema`.
 * Works with any object exposing `.safeParse(value)` — Zod v3+, Yup
 * with a shim, or a hand-rolled parser.
 */
export function toMatchZodSchema(
  this: MatcherState,
  received: unknown,
  schema: {
    safeParse: (value: unknown) => { success: boolean; error?: unknown };
  },
): MatcherResult {
  const result = schema.safeParse(received);
  return {
    pass: result.success,
    actual: received,
    expected: "value satisfying the provided schema",
    message: () =>
      this.isNot
        ? `expected ${JSON.stringify(received)} NOT to satisfy the schema`
        : `expected ${JSON.stringify(received)} to satisfy the schema. ` +
          `Errors: ${result.error === undefined ? "(none)" : JSON.stringify(result.error)}`,
  };
}

/**
 * `toHaveBeenCalledWithinLast` — assert that `method` was invoked on
 * an assertable proxy within the last `ms` milliseconds.
 *
 * Works ONLY on values returned by `createAssertableProxy(...)` —
 * the matcher reads `received.$.history()` and compares the last
 * matching call's `timestamp` to `Date.now()`.
 */
export function toHaveBeenCalledWithinLast(
  this: MatcherState,
  received: unknown,
  method: string,
  ms: number,
): MatcherResult {
  const proxy = received as AssertableProxy<Record<string, unknown>> | undefined;
  const api = proxy?.$;
  if (!api || typeof api.history !== "function") {
    return {
      pass: false,
      actual: received,
      expected: "an assertable proxy (created via createAssertableProxy)",
      message: () =>
        "expected receiver to be an assertable proxy, but got " +
        `${typeof received} — did you forget createAssertableProxy(...)?`,
    };
  }

  const calls = api.history().filter((call: IRecordedCall) => call.method === method);
  const latest = calls[calls.length - 1];
  const now = Date.now();
  const withinWindow = latest !== undefined && now - latest.timestamp <= ms;

  return {
    pass: withinWindow,
    actual: latest
      ? { timestamp: latest.timestamp, deltaMs: now - latest.timestamp }
      : "(no call recorded)",
    expected: `a call to '${method}' within the last ${ms} ms`,
    message: () =>
      this.isNot
        ? `expected '${method}' NOT to have been called within the last ${ms} ms`
        : `expected '${method}' to have been called within the last ${ms} ms; ` +
          (latest === undefined
            ? "no calls recorded"
            : `last call was ${now - latest.timestamp} ms ago`),
  };
}

// ─── Registration ───────────────────────────────────────────────────

/**
 * Register every custom matcher on Vitest's global `expect`.
 * Idempotent — calling it twice is harmless (Vitest deduplicates).
 *
 * @example
 * ```ts
 * // Register in your test setup file
 * import { registerAllMatchers } from "@stackra/testing/matchers";
 *
 * beforeAll(() => {
 *   registerAllMatchers();
 * });
 * ```
 */
export function registerAllMatchers(): void {
  expect.extend({
    toBeUlid,
    toMatchZodSchema,
    toHaveBeenCalledWithinLast,
  });
}
