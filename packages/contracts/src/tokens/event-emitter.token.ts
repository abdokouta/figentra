/**
 * @file event-emitter.token.ts
 * @module @stackra/contracts/tokens
 * @description DI token for the event emitter service.
 *   Binds `IEventEmitter` — the workspace's Lane 3 event bus.
 */

/** Injection token for `IEventEmitter`. */
export const EVENT_EMITTER: unique symbol = Symbol.for("EVENT_EMITTER");
