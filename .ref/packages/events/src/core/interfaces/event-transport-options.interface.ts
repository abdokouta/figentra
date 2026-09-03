/**
 * @file event-transport-options.interface.ts
 * @module @stackra/events/core/interfaces
 * @description Options for the `@EventTransport()` class decorator.
 *   Transports are external event sources (WebSocket, SSE, BroadcastChannel)
 *   that inject events into the local EventEmitter.
 */

// ════════════════════════════════════════════════════════════════════════════════
// Interfaces
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Options passed to the `@EventTransport()` class decorator.
 */
export interface IEventTransportOptions {
  /**
   * Unique name for this transport (used by the registry for lookup).
   *
   * @example 'websocket', 'broadcast-channel', 'sse'
   */
  name: string;
}

/**
 * Contract that transport classes must implement.
 *
 * At bootstrap, the `EventSubscribersLoader` calls `connect(emitter)`
 * on each discovered transport. The transport then listens to its
 * external source and re-emits events on the provided emitter.
 *
 * On shutdown, `disconnect()` is called to clean up resources.
 */
export interface IEventTransport {
  /**
   * Connect the transport to the event emitter.
   *
   * Called once at application bootstrap. The transport should start
   * listening to its external source and forward events to the emitter.
   *
   * @param emitter - The application's EventEmitter instance
   */
  connect(emitter: IEventEmitterLike): void;

  /**
   * Disconnect the transport and release resources.
   *
   * Called on application shutdown. Close sockets, clear intervals, etc.
   */
  disconnect(): void;
}

/**
 * Minimal emitter interface that transports interact with.
 *
 * Transports only need `emit()` — they push events into the system.
 */
export interface IEventEmitterLike {
  /** Emit an event with optional arguments. */
  emit(event: string | symbol, ...args: unknown[]): boolean;
}
