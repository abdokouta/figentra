/**
 * @file use-is-leader.hook.spec.ts
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
      fn();
    },
  };
});

import { useIsLeader } from "../../../src/react/hooks/use-is-leader/use-is-leader.hook";

describe("useIsLeader()", () => {
  it("returns true when the coordinator says the tab is the leader", () => {
    const coordinator = {
      isLeader: () => true,
      onRoleChange: () => () => undefined,
    };
    useInjectMock.mockReturnValue(coordinator);
    expect(useIsLeader()).toBe(true);
  });

  it("returns false when the coordinator says the tab is a follower", () => {
    const coordinator = {
      isLeader: () => false,
      onRoleChange: () => () => undefined,
    };
    useInjectMock.mockReturnValue(coordinator);
    expect(useIsLeader()).toBe(false);
  });
});
