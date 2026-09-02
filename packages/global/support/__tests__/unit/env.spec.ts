/**
 * @file env.spec.ts
 * @module @stackra/support/__tests__/unit
 * @description Behavioural spec for the `Env` façade.
 *
 *   Uses `vi.stubEnv` (which mutates `process.env` deterministically
 *   with per-test cleanup via the shared `@stackra/testing/setup`).
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { Env } from "../../src/env";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Env.get", () => {
  it("returns the environment value when set", () => {
    vi.stubEnv("APP_NAME", "Stackra");
    expect(Env.get("APP_NAME")).toBe("Stackra");
  });

  it("returns the default when the variable is unset", () => {
    // Ensure any inherited value is cleared before this test.
    vi.stubEnv("STACKRA_NEVER_SET_KEY", "");
    expect(Env.get("STACKRA_NEVER_SET_KEY", "fallback")).toBe("fallback");
  });

  it("returns the default when the variable is an empty string", () => {
    vi.stubEnv("EMPTY_KEY", "");
    expect(Env.get("EMPTY_KEY", "default")).toBe("default");
  });

  it("defaults to empty string when neither the value nor a default is provided", () => {
    vi.stubEnv("EMPTY_KEY_2", "");
    expect(Env.get("EMPTY_KEY_2")).toBe("");
  });
});

describe("Env.getOrFail", () => {
  it("returns the value when set", () => {
    vi.stubEnv("REQUIRED_KEY", "secret");
    expect(Env.getOrFail("REQUIRED_KEY")).toBe("secret");
  });

  it("throws a descriptive error when unset", () => {
    vi.stubEnv("MISSING_KEY", "");
    expect(() => Env.getOrFail("MISSING_KEY")).toThrow(
      "Environment variable [MISSING_KEY] is not set.",
    );
  });
});

describe("Env.getNumber", () => {
  it("parses a numeric string", () => {
    vi.stubEnv("PORT", "8080");
    expect(Env.getNumber("PORT")).toBe(8080);
  });

  it("returns the default when unset", () => {
    vi.stubEnv("MISSING_NUM", "");
    expect(Env.getNumber("MISSING_NUM", 3000)).toBe(3000);
  });

  it("returns the default when the value is not a valid number", () => {
    vi.stubEnv("NAN_KEY", "not-a-number");
    expect(Env.getNumber("NAN_KEY", 42)).toBe(42);
  });

  it("parses floats", () => {
    vi.stubEnv("RATE", "0.75");
    expect(Env.getNumber("RATE")).toBe(0.75);
  });
});

describe("Env.getBoolean", () => {
  it("returns true for 'true', '1', 'yes', 'on' (case-insensitive)", () => {
    for (const value of ["true", "TRUE", "1", "yes", "Yes", "on", "ON"]) {
      vi.stubEnv("FLAG", value);
      expect(Env.getBoolean("FLAG")).toBe(true);
    }
  });

  it("returns false for other values", () => {
    for (const value of ["false", "0", "no", "off", "maybe"]) {
      vi.stubEnv("FLAG", value);
      expect(Env.getBoolean("FLAG", true)).toBe(false);
    }
  });

  it("returns the default when unset", () => {
    vi.stubEnv("MISSING_FLAG", "");
    expect(Env.getBoolean("MISSING_FLAG", true)).toBe(true);
    expect(Env.getBoolean("MISSING_FLAG", false)).toBe(false);
  });
});

describe("Env.is / .isProduction / .isDevelopment / .isTest", () => {
  it("is(env) compares case-insensitively against NODE_ENV", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(Env.is("production")).toBe(true);
    expect(Env.is("Production")).toBe(true);
    expect(Env.is("development")).toBe(false);
  });

  it("isProduction returns true iff NODE_ENV=production", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(Env.isProduction()).toBe(true);
    vi.stubEnv("NODE_ENV", "development");
    expect(Env.isProduction()).toBe(false);
  });

  it("isDevelopment returns true iff NODE_ENV=development", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(Env.isDevelopment()).toBe(true);
    vi.stubEnv("NODE_ENV", "production");
    expect(Env.isDevelopment()).toBe(false);
  });

  it("isTest returns true iff NODE_ENV=test", () => {
    vi.stubEnv("NODE_ENV", "test");
    expect(Env.isTest()).toBe(true);
    vi.stubEnv("NODE_ENV", "production");
    expect(Env.isTest()).toBe(false);
  });

  it("defaults to 'development' when NODE_ENV is unset", () => {
    vi.stubEnv("NODE_ENV", "");
    expect(Env.isDevelopment()).toBe(true);
  });
});
