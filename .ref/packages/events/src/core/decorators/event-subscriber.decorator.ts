/**
 * @file event-subscriber.decorator.ts
 * @module @stackra/events/core/decorators
 * @description Class decorator for multi-event subscriber classes.
 *   An event subscriber maps multiple events to handler methods in one class
 *   (Laravel's EventSubscriber pattern). Discovered at bootstrap alongside @OnEvent.
 */

import { defineMetadata } from '@vivtel/metadata';

// ════════════════════════════════════════════════════════════════════════════════
// Constants
// ════════════════════════════════════════════════════════════════════════════════

/** Metadata key for event subscriber classes. */
export const EVENT_SUBSCRIBER_METADATA = 'stackra:events:subscriber';

// ════════════════════════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════════════
// Decorator
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Mark a class as an event subscriber with a declarative event-to-method map.
 *
 * Unlike `@OnEvent()` (per-method), `@EventSubscriber()` defines all
 * subscriptions at the class level. The class must have methods matching
 * the values in the map.
 *
 * @param events - Map of event names to handler method names
 * @returns A class decorator
 *
 * @example
 * ```typescript
 * @EventSubscriber({
 *   'order.created': 'onOrderCreated',
 *   'order.shipped': 'onOrderShipped',
 *   'order.cancelled': 'onOrderCancelled',
 * })
 * @Injectable()
 * class OrderSubscriber {
 *   async onOrderCreated(payload: OrderPayload): Promise<void> {
 *     await this.analytics.track('order_placed', payload);
 *   }
 *
 *   async onOrderShipped(payload: OrderPayload): Promise<void> {
 *     await this.notifications.send('order_shipped', payload);
 *   }
 *
 *   async onOrderCancelled(payload: OrderPayload): Promise<void> {
 *     await this.refundService.process(payload);
 *   }
 * }
 * ```
 */
export function EventSubscriber(events: EventSubscriberMap): ClassDecorator {
  return (target: Function) => {
    defineMetadata(EVENT_SUBSCRIBER_METADATA, events, target);
  };
}
