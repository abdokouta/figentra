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
} from './core';
export type {
  IEventEmitterConfig,
  IOnEventMetadata,
  IOnEventOptions,
  IEventTransportOptions,
  IEventTransport,
  IEventEmitterLike,
} from './core';
export { NestEventsModule } from './nestjs';
export { useEventEmitter, useOnEvent } from './react';
