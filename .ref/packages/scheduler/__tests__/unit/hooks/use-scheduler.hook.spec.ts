/**
 * @file use-scheduler.hook.spec.ts
 * @module @stackra/scheduler/__tests__/unit/hooks
 */

import { describe, expect, it, vi } from "vitest";

const { useInjectMock } = vi.hoisted(() => ({
  useInjectMock: vi.fn(),
}));

vi.mock("@stackra/container/react", () => ({
  useInject: useInjectMock,
}));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useState: <T>(initial: T | (() => T)): [T, (next: T) => void] => {
      const value =
        typeof initial === "function" ? (initial as () => T)() : initial;
      return [value, () => undefined];
    },
    useCallback: <T>(fn: T): T => fn,
  };
});

import { useScheduler } from "../../../src/react/hooks/use-scheduler/use-scheduler.hook";

describe("useScheduler()", () => {
  it("returns tasks + refresh/pause/resume/runNow functions", () => {
    const tasks = [{ name: "t1", isRunning: false, isPaused: false }];
    const scheduler = {
      getRegistered: vi.fn(() => tasks),
      pause: vi.fn(),
      resume: vi.fn(),
      runNow: vi.fn(async () => undefined),
    };
    useInjectMock.mockReturnValue(scheduler);

    const result = useScheduler();
    expect(result.tasks).toEqual(tasks);
    expect(typeof result.refresh).toBe("function");
    expect(typeof result.pause).toBe("function");
    expect(typeof result.resume).toBe("function");
    expect(typeof result.runNow).toBe("function");
  });

  it("pause delegates to scheduler.pause", () => {
    const scheduler = {
      getRegistered: vi.fn(() => []),
      pause: vi.fn(),
      resume: vi.fn(),
      runNow: vi.fn(),
    };
    useInjectMock.mockReturnValue(scheduler);

    const result = useScheduler();
    result.pause("my-task");
    expect(scheduler.pause).toHaveBeenCalledWith("my-task");
  });
});
