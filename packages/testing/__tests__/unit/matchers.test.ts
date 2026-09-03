/**
 * @file matchers.test.ts
 * @module @stackra/testing/__tests__/unit
 * @description Unit tests for the workspace's custom Vitest matchers —
 *   `toBeUlid`, `toMatchZodSchema`, `toHaveBeenCalledWithinLast`.
 *
 *   The matchers are registered globally by the test-setup file
 *   (`__tests__/vitest.setup.ts` → `../src/setup` → `registerAllMatchers`),
 *   so `expect(...).toBeUlid()` etc. work at every call site. Each
 *   matcher is also imported directly for a targeted "raw matcher"
 *   assertion to verify the pass/fail message contract.
 */

import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { createAssertableProxy } from "@/core/assertable";
import {
  toBeUlid,
  toHaveBeenCalledWithinLast,
  toMatchZodSchema,
} from "@/matchers";

/**
 * A stand-in for Vitest's `MatcherState` so we can invoke the raw
 * matcher functions directly. We only care about `isNot` for message
 * inversion — the rest can be minimal.
 */
type MatcherStateShape = { isNot: boolean };

const positiveState: MatcherStateShape = { isNot: false };
const negatedState: MatcherStateShape = { isNot: true };

describe("toBeUlid", () => {
  // ── expect().toBeUlid() (registered globally) ─────────────────

  it("passes for a well-formed ULID string", () => {
    // Deterministic ULID emitted by the upstream `ulid` package.
    expect("01HGP2Q3W4V5X6Y7Z8A9B0C1D2").toBeUlid();
  });

  it("fails on empty string", () => {
    expect(() => expect("").toBeUlid()).toThrow();
  });

  it("fails when the length is wrong", () => {
    expect(() => expect("01HGP2Q3W4V5X6Y7").toBeUlid()).toThrow();
  });

  it("fails when the leading character is 8 or 9", () => {
    expect(() =>
      expect("81HGP2Q3W4V5X6Y7Z8A9B0C1D2").toBeUlid(),
    ).toThrow();
  });

  it("fails when the string contains disallowed chars (I/L/O/U)", () => {
    expect(() =>
      expect("01HGP2Q3W4V5X6Y7Z8A9B0C1DI").toBeUlid(),
    ).toThrow();
  });

  it("fails on a non-string value", () => {
    expect(() => expect(12345).toBeUlid()).toThrow();
    expect(() => expect(null).toBeUlid()).toThrow();
    expect(() => expect(undefined).toBeUlid()).toThrow();
  });

  it("supports .not.toBeUlid() for negation", () => {
    expect("not-a-ulid").not.toBeUlid();
    expect(() =>
      expect("01HGP2Q3W4V5X6Y7Z8A9B0C1D2").not.toBeUlid(),
    ).toThrow();
  });

  // ── Raw function contract ─────────────────────────────────────

  describe("raw matcher function", () => {
    it("returns pass=true for a valid ULID", () => {
      const result = toBeUlid.call(
        positiveState as never,
        "01HGP2Q3W4V5X6Y7Z8A9B0C1D2",
      );
      expect(result.pass).toBe(true);
      expect(result.expected).toMatch(/valid ULID/);
    });

    it("returns pass=false for invalid input with a positive-message hint", () => {
      const result = toBeUlid.call(positiveState as never, "nope");
      expect(result.pass).toBe(false);
      expect(result.message()).toMatch(/expected .* to be a valid ULID/);
    });

    it("inverts the message when isNot=true", () => {
      const result = toBeUlid.call(
        negatedState as never,
        "01HGP2Q3W4V5X6Y7Z8A9B0C1D2",
      );
      expect(result.message()).toMatch(/NOT to be a ULID/);
    });
  });
});

describe("toMatchZodSchema", () => {
  const UserSchema = z.object({
    id: z.string(),
    name: z.string(),
    age: z.number().int().nonnegative(),
  });

  // ── expect().toMatchZodSchema() ───────────────────────────────

  it("passes for a value satisfying the schema", () => {
    expect({ id: "u1", name: "Ada", age: 25 }).toMatchZodSchema(
      UserSchema,
    );
  });

  it("fails for a value that violates the schema", () => {
    expect(() =>
      expect({ id: "u1", name: "Ada", age: -1 }).toMatchZodSchema(
        UserSchema,
      ),
    ).toThrow();
  });

  it("fails when required fields are missing", () => {
    expect(() =>
      expect({ id: "u1" }).toMatchZodSchema(UserSchema),
    ).toThrow();
  });

  it("supports .not.toMatchZodSchema()", () => {
    expect({ not: "a user" }).not.toMatchZodSchema(UserSchema);
  });

  it("works with any object exposing safeParse (duck-typed)", () => {
    const customSchema = {
      safeParse: (v: unknown) => ({ success: v === "magic" }),
    };
    expect("magic").toMatchZodSchema(customSchema);
    expect(() => expect("nope").toMatchZodSchema(customSchema)).toThrow();
  });

  // ── Raw function contract ─────────────────────────────────────

  describe("raw matcher function", () => {
    it("returns pass=true when safeParse succeeds", () => {
      const result = toMatchZodSchema.call(
        positiveState as never,
        { id: "u1", name: "n", age: 1 },
        UserSchema as never,
      );
      expect(result.pass).toBe(true);
    });

    it("includes schema errors in the failure message", () => {
      const result = toMatchZodSchema.call(
        positiveState as never,
        { id: "u1", name: "n", age: -1 },
        UserSchema as never,
      );
      expect(result.pass).toBe(false);
      // The message contains the JSON-stringified error payload.
      expect(result.message()).toMatch(/to satisfy the schema/);
    });

    it("inverts the message when isNot=true", () => {
      const result = toMatchZodSchema.call(
        negatedState as never,
        { id: "u1", name: "n", age: 1 },
        UserSchema as never,
      );
      expect(result.message()).toMatch(/NOT to satisfy the schema/);
    });
  });
});

describe("toHaveBeenCalledWithinLast", () => {
  // ── expect().toHaveBeenCalledWithinLast() ─────────────────────

  it("passes when the method was called within the window", () => {
    const svc = createAssertableProxy({
      touch(): void {
        /* noop */
      },
    });
    svc.touch();
    expect(svc).toHaveBeenCalledWithinLast("touch", 1000);
  });

  it("fails when the method has never been called", () => {
    const svc = createAssertableProxy({
      touch(): void {
        /* noop */
      },
    });
    expect(() =>
      expect(svc).toHaveBeenCalledWithinLast("touch", 1000),
    ).toThrow();
  });

  it("fails when the last call is older than the window", () => {
    // Use real Date-mocking so the historical timestamp lands
    // outside the window without needing to sleep.
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const svc = createAssertableProxy({
      touch(): void {
        /* noop */
      },
    });
    svc.touch();

    // Advance an hour — well past a 1-second window.
    vi.setSystemTime(new Date("2026-01-01T01:00:00Z"));

    expect(() =>
      expect(svc).toHaveBeenCalledWithinLast("touch", 1000),
    ).toThrow();

    vi.useRealTimers();
  });

  it("fails when the receiver is not an assertable proxy", () => {
    // The matcher's error text names the missing shape.
    expect(() =>
      expect({}).toHaveBeenCalledWithinLast("anything", 1000),
    ).toThrow();
    expect(() =>
      expect(null).toHaveBeenCalledWithinLast("anything", 1000),
    ).toThrow();
  });

  // ── Raw function contract ─────────────────────────────────────

  describe("raw matcher function", () => {
    it("reports a helpful message when the receiver is not a proxy", () => {
      const result = toHaveBeenCalledWithinLast.call(
        positiveState as never,
        {},
        "anything",
        1000,
      );
      expect(result.pass).toBe(false);
      expect(result.message()).toMatch(/expected receiver to be an assertable proxy/);
    });

    it("names the elapsed delta on failure when a call exists", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
      const svc = createAssertableProxy({
        touch(): void {
          /* noop */
        },
      });
      svc.touch();
      vi.setSystemTime(new Date("2026-01-01T00:00:05Z"));

      const result = toHaveBeenCalledWithinLast.call(
        positiveState as never,
        svc as never,
        "touch",
        1000,
      );
      expect(result.pass).toBe(false);
      expect(result.message()).toMatch(/ms ago/);
      vi.useRealTimers();
    });

    it("reports 'no calls recorded' when nothing matches", () => {
      const svc = createAssertableProxy({
        touch(): void {
          /* noop */
        },
      });
      const result = toHaveBeenCalledWithinLast.call(
        positiveState as never,
        svc as never,
        "never-called",
        1000,
      );
      expect(result.message()).toMatch(/no calls recorded/);
    });

    it("inverts the message when isNot=true", () => {
      const svc = createAssertableProxy({
        touch(): void {
          /* noop */
        },
      });
      svc.touch();
      const result = toHaveBeenCalledWithinLast.call(
        negatedState as never,
        svc as never,
        "touch",
        1000,
      );
      expect(result.message()).toMatch(/NOT to have been called/);
    });
  });
});
