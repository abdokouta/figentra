/**
 * @file use-tab-count.hook.spec.ts
 * @module @stackra/coordinator/__tests__/unit/hooks
 */

import { describe, expect, it, vi } from "vitest";

const { useInjectMock } = vi.hoisted(() => ({ useInjectMock: vi.fn() }));

vi.mock("@stackra/container/react", () => ({ useInject: useInjectMock }));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useState: <T>(initial: T | (() => T)): [T, (next: T) => void] => {
      const value =
        typeof initial === "function" ? (initial as () => T)() : initial;
      return [value, () => undefined];
    },
    useEffect: (fn: () => void | (() => void)) => {
      // Return early without registering the interval — tests only
      // care about the initial value.
      const cleanup = fn();
      if (typeof cleanup === "function") cleanup();
    },
  };
});

import { useTabCount } from "../../../src/react/hooks/use-tab-count/use-tab-count.hook";

describe("useTabCount()", () => {
  it("returns the initial tab count from the coordinator", () => {
    const coordinator = {
      getTabCount: () => 3,
    };
    useInjectMock.mockReturnValue(coordinator);
    expect(useTabCount()).toBe(3);
  });
});
