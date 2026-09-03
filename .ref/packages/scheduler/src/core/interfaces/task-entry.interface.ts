/**
 * @file task-entry.interface.ts
 * @module @stackra/scheduler/core/interfaces
 * @description Task entry interface representing a registered scheduled task.
 */

import type { ITaskOptions } from "./task-options.interface";

/**
 * Registered scheduled task — the runtime record stored in the
 * scheduler's registry alongside a live `timer` handle.
 */
export interface ITaskEntry {
  /** Task identifier — unique across the scheduler instance. */
  readonly name: string;

  /** The task body. Errors bubble to the scheduler's error listener. */
  readonly fn: () => Promise<void>;

  /** Frozen options the task was registered with (schedule, retries, ...). */
  readonly options: ITaskOptions;

  /** Live handle from `setTimeout` / `setInterval`; `undefined` when paused. */
  timer?: ReturnType<typeof setTimeout> | ReturnType<typeof setInterval>;

  /** Timestamp (ms epoch) of the last successful run — `undefined` when never run. */
  lastRun?: number;

  /** `true` while a task invocation is in flight. */
  isRunning: boolean;

  /** `true` when the task is temporarily suspended via `pause(name)`. */
  isPaused: boolean;

  /** `true` when the task's schedule is cron-shaped rather than interval-shaped. */
  isCron: boolean;
}
