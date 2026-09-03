/**
 * @file index.ts
 * @module @stackra/events/core/interfaces
 * @description Barrel export for internal event system interfaces.
 *   Cross-package interfaces (IEventEmitter, IEventTransport) should
 *   live in @stackra/contracts. These are internal-only.
 */
export type { IEventEmitterConfig } from './event-emitter-config.interface';
export type { IOnEventMetadata, IOnEventOptions } from './on-event-metadata.interface';
export type {
  IEventTransportOptions,
  IEventTransport,
  IEventEmitterLike,
} from './event-transport-options.interface';
