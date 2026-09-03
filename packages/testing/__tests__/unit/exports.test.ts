/**
 * @file exports.test.ts
 * @module @stackra/testing/__tests__/unit
 * @description Barrel-resolution smoke tests for the workspace-safe
 *   subpaths of `@stackra/testing` — `@/core`, `@/matchers`, `@/setup`.
 *
 *   Verifies each canonical export is present + has the expected
 *   shape. Skips the peer-heavy subpaths (`@/nest`, `@/worker`,
 *   `@/database`, `@/react`) — those require optional peers
 *   (`@nestjs/testing`, `miniflare`, `@electric-sql/pglite`,
 *   `@testing-library/react`) that are installed by consumers, not
 *   here. Their smoke coverage lives in downstream consumer suites.
 */

import { describe, expect, it } from "vitest";

import * as core from "@/core";
import * as matchers from "@/matchers";

describe("@stackra/testing barrel exports", () => {
  describe("@/core", () => {
    it("re-exports createAssertableProxy as a function", () => {
      expect(typeof core.createAssertableProxy).toBe("function");
    });

    it("re-exports the TestContainer + createTestContainer surface", () => {
      expect(typeof core.TestContainer).toBe("function");
      expect(typeof core.createTestContainer).toBe("function");
    });

    it("re-exports factory + RNG + Sequence primitives", () => {
      expect(typeof core.defineFactory).toBe("function");
      expect(typeof core.Rng).toBe("function");
      expect(typeof core.Sequence).toBe("function");
    });

    it("re-exports the time-control helpers", () => {
      expect(typeof core.freezeTime).toBe("function");
      expect(typeof core.travelTo).toBe("function");
      expect(typeof core.travelBy).toBe("function");
      expect(typeof core.restoreTime).toBe("function");
      expect(typeof core.now).toBe("function");
    });

    it("re-exports the ULID generator factory", () => {
      expect(typeof core.createUlidGenerator).toBe("function");
    });
  });

  describe("@/matchers", () => {
    it("exports registerAllMatchers as a function", () => {
      expect(typeof matchers.registerAllMatchers).toBe("function");
    });

    it("exports each raw matcher function", () => {
      expect(typeof matchers.toBeUlid).toBe("function");
      expect(typeof matchers.toMatchZodSchema).toBe("function");
      expect(typeof matchers.toHaveBeenCalledWithinLast).toBe("function");
    });

    it("registerAllMatchers is idempotent (no throw on repeat)", () => {
      // Setup already called it once at load; extra invocations must
      // stay safe.
      expect(() => matchers.registerAllMatchers()).not.toThrow();
      expect(() => matchers.registerAllMatchers()).not.toThrow();
    });
  });

  describe("@/setup", () => {
    it("loads without throwing (side-effect module)", async () => {
      // The setup file has already run via vitest.setup.ts, so a
      // fresh import is a no-op — but importing again should never
      // throw. This exercises the module-loading path explicitly.
      await expect(import("@/setup")).resolves.toBeDefined();
    });

    it("global matchers are registered — expect().toBeUlid() is usable", () => {
      // Direct proof the setup wired the matcher on global expect.
      expect(() =>
        expect("01HGP2Q3W4V5X6Y7Z8A9B0C1D2").toBeUlid(),
      ).not.toThrow();
    });
  });
});
