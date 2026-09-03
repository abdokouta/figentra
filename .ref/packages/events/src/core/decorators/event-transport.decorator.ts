/**
 * @file event-transport.decorator.ts
 * @module @stackra/events/core/decorators
 * @description Class decorator to mark an `@Injectable()` class as an event transport.
 *   The `EventSubscribersLoader` discovers these at bootstrap and calls
 *   their `connect(emitter)` method. The class must implement `IEventTransport`.
 */

import { defineMetadata } from '@vivtel/metadata';

import { EVENT_TRANSPORT_METADATA } from '../constants';
import type { IEventTransportOptions } from '../interfaces';

// ════════════════════════════════════════════════════════════════════════════════
// Decorator
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Mark a class as an event transport for auto-discovery.
 *
 * Transports are external event sources (WebSocket, SSE, BroadcastChannel)
 * that inject events into the local EventEmitter. At bootstrap, the
 * `EventSubscribersLoader` discovers all `@EventTransport` classes and
 * calls `connect(emitter)` on each.
 *
 * @param options - Transport configuration (`name` is required)
 * @returns A class decorator
 *
 * @example
 * ```typescript
 * @EventTransport({ name: 'websocket' })
 * @Injectable()
 * class WebSocketTransport implements IEventTransport {
 *   connect(emitter: EventEmitter): void {
 *     this.socket.on('message', (data) => {
 *       emitter.emit(data.event, data.payload);
 *     });
 *   }
 *
 *   disconnect(): void {
 *     this.socket.close();
 *   }
 * }
 * ```
 */
export function EventTransport(options: IEventTransportOptions): ClassDecorator {
  return (target: object) => {
    defineMetadata(EVENT_TRANSPORT_METADATA, options, target);
  };
}
