/**
 * @file expo-background-fetch.interface.ts
 * @module @stackra/contracts/interfaces/expo
 * @description Canonical structural narrowing of
 *   `expo-background-fetch`'s public surface — the OS-side scheduler
 *   that wakes the app periodically to drain queued work.
 *
 *   ## Consumers (as of 2026-07-27)
 *
 *   - `@stackra/sync/native` — `ExpoBackgroundFetchTask` lazy-imports
 *     `expo-background-fetch` (paired with `expo-task-manager`, see
 *     `IExpoTaskManager`) and narrows the resolved module to this
 *     shape.
 *
 *   ## Platform notes
 *
 *   - **iOS.** Requires `Info.plist` `UIBackgroundModes` to include
 *     `fetch`. iOS enforces power budgets — `minimumInterval` is
 *     rounded up to the OS-chosen grain (~15 min on cellular, ~5 min
 *     on Wi-Fi).
 *   - **Android.** Requires WorkManager permissions in
 *     `AndroidManifest.xml`. Batching is more permissive than iOS
 *     but still tolerates ONLY approximate schedules.
 */

/**
 * The `BackgroundFetchResult` enum shape returned by task
 * executors and consumed by the OS scheduler.
 *
 * Numeric-typed to match `expo-background-fetch`'s own enum. Every
 * consumer forwards Expo's own constants rather than authoring its
 * own numbers.
 */
export interface IExpoBackgroundFetchResultEnum {
  /** The task ran but had nothing to fetch. */
  readonly NoData: number;
  /** The task ran and fetched fresh data. */
  readonly NewData: number;
  /** The task failed. */
  readonly Failed: number;
}

/**
 * Structural view of the subset of `expo-background-fetch`'s
 * public API `@stackra/*` packages consume. Every method + enum
 * routes 1:1 to the same-named export on the concrete
 * `expo-background-fetch` module.
 *
 * @example
 * ```typescript
 * import type { IExpoBackgroundFetch } from "@stackra/contracts";
 *
 * async function loadPeer(): Promise<IExpoBackgroundFetch | null> {
 *   try {
 *     const spec = "expo-background-fetch";
 *     const mod = (await import(spec)) as
 *       { default?: IExpoBackgroundFetch } & IExpoBackgroundFetch;
 *     const resolved: IExpoBackgroundFetch =
 *       typeof mod.registerTaskAsync === "function" ? mod : mod.default!;
 *     return resolved;
 *   } catch {
 *     return null;
 *   }
 * }
 * ```
 */
export interface IExpoBackgroundFetch {
  /**
   * Register a previously-defined task (via
   * `IExpoTaskManager.defineTask`) with the OS scheduler.
   *
   * @param taskName - Task identifier — must match the name
   *   passed to `defineTask` first (Expo documents crashing when
   *   the order is inverted).
   * @param options - Scheduler options: `minimumInterval`
   *   (seconds — iOS rounds up), `stopOnTerminate` (whether
   *   force-quit cancels the schedule; default `true` on
   *   Android), `startOnBoot` (whether device reboot re-arms
   *   the schedule; default `true` on Android).
   */
  registerTaskAsync(
    taskName: string,
    options: {
      minimumInterval?: number;
      stopOnTerminate?: boolean;
      startOnBoot?: boolean;
    },
  ): Promise<void>;

  /**
   * Unregister a task from the OS scheduler. Reverse of
   * `registerTaskAsync`. Safe to call on a task that was never
   * registered — degrades to a no-op.
   */
  unregisterTaskAsync(taskName: string): Promise<void>;

  /**
   * Status enum consumed by task executors — the executor's
   * return value tells the OS whether to keep scheduling the
   * task, punish it (reduce future frequency), or dequeue it.
   */
  readonly BackgroundFetchResult: IExpoBackgroundFetchResultEnum;

  /**
   * Ask the OS whether background-fetch is available to this
   * app. Returns `null` on some platforms when the query itself
   * isn't supported.
   */
  getStatusAsync(): Promise<number | null>;
}
