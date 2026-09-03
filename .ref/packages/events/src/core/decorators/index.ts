/**
 * @file index.ts
 * @module @stackra/events/core/decorators
 * @description Barrel export for event decorators.
 */
export { OnEvent } from './on-event.decorator';
export { EventTransport } from './event-transport.decorator';
export { InjectEventEmitter } from './inject-event-emitter.decorator';
export {
  EventSubscriber,
  EVENT_SUBSCRIBER_METADATA,
  type EventSubscriberMap,
} from './event-subscriber.decorator';
