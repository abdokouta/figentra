/**
 * @file index.ts
 * @module @stackra/events/nestjs
 * @description NestJS subpath for the events module.
 *   Provides `NestEventsModule` which wraps core + adds DiscoveryService.
 *   Re-exports all core symbols for convenience.
 */

// ════════════════════════════════════════════════════════════════════════════════
// NestJS Module
// ════════════════════════════════════════════════════════════════════════════════
export { NestEventsModule } from './nest-events.module';

// ════════════════════════════════════════════════════════════════════════════════
// Re-export core (convenience — consumers only import one subpath)
// ════════════════════════════════════════════════════════════════════════════════
export {
  EventEmitterModule,
  EventEmitter,
  type EventListener,
  EventTransportRegistry,
  EventSubscribersLoader,
  OnEvent,
  EventTransport,
  InjectEventEmitter,
  EventSubscriber,
  EVENT_SUBSCRIBER_METADATA,
  type EventSubscriberMap,
  EventEmitterError,
  EventListenerError,
  EventTransportError,
  defineConfig,
} from '../core';
export type {
  IEventEmitterConfig,
  IOnEventMetadata,
  IOnEventOptions,
  IEventTransportOptions,
  IEventTransport,
  IEventEmitterLike,
} from '../core';
