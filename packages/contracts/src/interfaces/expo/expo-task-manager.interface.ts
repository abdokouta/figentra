/**
 * @file expo-task-manager.interface.ts
 * @module @stackra/contracts/interfaces/expo
 * @description Canonical structural narrowing of
 *   `expo-task-manager`'s public surface — the background-task
 *   registration substrate paired with `expo-background-fetch` +
 *   `expo-location`.
 *
 *   ## Consumers (as of 2026-07-27)
 *
 *   - `@stackra/sync/native` — `ExpoBackgroundFetchTask` lazy-imports
 *     `expo-task-manager` + `expo-background-fetch` and narrows to
 *     this shape (and to `IExpoBackgroundFetch` in the sibling
 *     interface file).
 *
 *   ## Ordering discipline
 *
 *   `defineTask(name, executor)` MUST be called BEFORE
 *   `registerTaskAsync(name, ...)` on `expo-background-fetch`. Expo
 *   documents this ordering as a crash contract. Every consumer that
 *   pairs the two modules honours it.
 */

/**
 * Structural view of the subset of `expo-task-manager`'s public
 * API `@stackra/*` packages consume. Every method routes 1:1 to
 * the same-named export on the concrete `expo-task-manager`
 * module.
 *
 * @example
 * ```typescript
 * import type { IExpoTaskManager } from "@stackra/contracts";
 *
 * async function loadPeer(): Promise<IExpoTaskManager | null> {
 *   try {
 *     const spec = "expo-task-manager";
 *     const mod = (await import(spec)) as
 *       { default?: IExpoTaskManager } & IExpoTaskManager;
 *     const resolved: IExpoTaskManager =
 *       typeof mod.defineTask === "function" ? mod : mod.default!;
 *     return resolved;
 *   } catch {
 *     return null;
 *   }
 * }
 * ```
 */
export interface IExpoTaskManager {
  /**
   * Define a task by name. Idempotent across calls per name — a
   * second `defineTask(name, executor)` replaces the executor
   * associated with the same name.
   *
   * The executor closure captures the DI-managed context the
   * consumer wants to invoke on wake. Expo re-instantiates the app
   * process on each wake, so the closure runs against a fresh
   * container.
   *
   * @param taskName - Task identifier. Consumers namespace their
   *   own task names (e.g. `stackra.sync.background-drain`).
   * @param executor - Callback invoked when the OS wakes the app
   *   for this task. Payload carries optional `data` (task-
   *   specific) + `error` (populated on failure).
   */
  defineTask(
    taskName: string,
    executor: (payload: {
      data?: unknown;
      error?: unknown;
    }) => Promise<unknown>,
  ): void;

  /**
   * Whether the given task name is currently registered with the
   * OS.
   *
   * @param taskName - Task identifier.
   * @returns `true` when the OS considers the task registered.
   */
  isTaskRegisteredAsync(taskName: string): Promise<boolean>;
}
