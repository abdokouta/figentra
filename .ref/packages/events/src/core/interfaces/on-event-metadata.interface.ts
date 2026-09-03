/**
 * @file on-event-metadata.interface.ts
 * @module @stackra/events/core/interfaces
 * @description Metadata shape stored by the `@OnEvent()` decorator.
 *   Each decorated method accumulates an array of these entries,
 *   allowing multiple `@OnEvent` decorators on the same method.
 */

// ════════════════════════════════════════════════════════════════════════════════
// Interface
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Metadata stored per `@OnEvent()` decoration.
 *
 * Multiple entries can exist on the same method (stacking).
 */
export interface IOnEventMetadata {
  /** The event name(s) this listener subscribes to. */
  event: string | symbol | Array<string | symbol>;

  /** Listener options (optional). */
  options?: IOnEventOptions;
}

/**
 * Options for individual event listeners.
 */
export interface IOnEventOptions {
  /**
   * Whether errors thrown by this listener should be suppressed.
   *
   * When `true` (default), listener errors are logged but don't
   * propagate to the emitter. When `false`, errors bubble up.
   *
   * @default true
   */
  suppressErrors?: boolean;

  /**
   * Whether to insert this listener before existing ones (LIFO order).
   *
   * @default false
   */
  prependListener?: boolean;

  /**
   * Whether the listener auto-removes after the first invocation.
   *
   * @default false
   */
  once?: boolean;

  /**
   * Whether to dispatch this listener as a queued background job.
   *
   * When `true`, instead of executing the listener inline, a job is
   * dispatched to `@stackra/queue` with the event payload. The listener
   * executes asynchronously in a worker process/tab.
   *
   * Requires `@stackra/queue` as a peer dependency. If the queue system
   * is not available, falls back to synchronous execution with a warning.
   *
   * @default false
   */
  queued?: boolean;

  /**
   * Queue name to dispatch to when `queued: true`.
   *
   * @default 'events'
   */
  queue?: string;

  /**
   * Delay in milliseconds before the queued job becomes eligible.
   *
   * Only applies when `queued: true`.
   *
   * @default 0 (immediate)
   */
  delay?: number;
}
