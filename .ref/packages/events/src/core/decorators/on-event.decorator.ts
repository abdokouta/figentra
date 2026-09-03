/**
 * @file on-event.decorator.ts
 * @module @stackra/events/core/decorators
 * @description Method decorator to subscribe a method to one or more events.
 *   The `EventSubscribersLoader` discovers these at bootstrap and binds
 *   them to the active EventEmitter. Stacking is supported — multiple
 *   `@OnEvent()` decorators on the same method subscribe it to multiple events.
 */

import { updateMetadata } from '@vivtel/metadata';

import { EVENT_LISTENER_METADATA } from '../constants';
import type { IOnEventMetadata, IOnEventOptions } from '../interfaces';

// ════════════════════════════════════════════════════════════════════════════════
// Decorator
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Subscribe a method to one or more events.
 *
 * The decorated method is automatically registered as a listener on the
 * `EventEmitter` at bootstrap. Supports:
 * - Single event: `@OnEvent('user.created')`
 * - Multiple events: `@OnEvent(['user.created', 'user.updated'])`
 * - Symbols: `@OnEvent(AUTH_EVENTS.LOGIN)`
 * - Stacking: multiple `@OnEvent()` on the same method
 *
 * @param event - Event name, symbol, or array of names/symbols
 * @param options - Listener options (suppressErrors, prependListener, once)
 * @returns A method decorator
 *
 * @example
 * ```typescript
 * @Injectable()
 * class OrderListener {
 *   @OnEvent('order.created')
 *   async onOrderCreated(payload: { orderId: string }): Promise<void> {
 *     await this.analytics.track('order_placed', payload);
 *   }
 *
 *   @OnEvent('order.created')
 *   @OnEvent('order.updated')
 *   async onOrderChanged(payload: unknown): Promise<void> {
 *     await this.cache.invalidate('orders');
 *   }
 * }
 * ```
 */
export function OnEvent(
  event: string | symbol | Array<string | symbol>,
  options?: IOnEventOptions
): MethodDecorator {
  return (
    _target: object,
    _key: string | symbol,
    descriptor: TypedPropertyDescriptor<any>
  ): TypedPropertyDescriptor<any> => {
    updateMetadata<IOnEventMetadata[]>(
      EVENT_LISTENER_METADATA,
      [],
      (existing) => [...existing, { event, ...(options !== undefined ? { options } : {}) }],
      descriptor.value as object
    );
    return descriptor;
  };
}
