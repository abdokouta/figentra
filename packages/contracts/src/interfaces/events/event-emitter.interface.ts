/**
 * @file event-emitter.interface.ts
 * @module @stackra/contracts/interfaces/events
 * @description Contract for the workspace's Lane 3 event emitter.
 *   Injected via `EVENT_EMITTER`. Fire-and-forget broadcast to
 *   unknown/unrelated subscribers.
 */

/**
 * Event emitter contract — injected via `EVENT_EMITTER`.
 */
export interface IEventEmitter {
  /**
   * Emit a named event with a typed payload. Subscribers registered via
   * `@OnEvent(name)` or `useOnEvent(name, handler)` receive the payload.
   *
   * @param name    - Event name (from a `*_EVENTS` constant).
   * @param payload - Typed event payload.
   */
  emit<TPayload = unknown>(name: string, payload: TPayload): void;

  /**
   * Register a listener for a named event.
   *
   * @param name    - Event name to listen for.
   * @param handler - Callback invoked on each emission.
   * @returns A disposer function that unregisters the listener.
   */
  on<TPayload = unknown>(
    name: string,
    handler: (payload: TPayload) => void | Promise<void>,
  ): () => void;
}
