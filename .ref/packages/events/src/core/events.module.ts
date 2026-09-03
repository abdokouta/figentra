/**
 * @file events.module.ts
 * @module @stackra/events/core
 * @description DI module for the event system.
 *   Registers EventEmitter, EventTransportRegistry, and EventSubscribersLoader
 *   globally. Works in both ts-container (frontend) and NestJS (backend).
 */

import { Module, type IDynamicModule } from '@stackra/ts-container';

import {
  EVENT_EMITTER_TOKEN,
  EVENT_EMITTER_CONFIG_TOKEN,
  EVENT_TRANSPORT_REGISTRY_TOKEN,
} from './constants';
import { EventEmitter } from './services/event-emitter.service';
import { EventTransportRegistry } from './services/event-transport-registry.service';
import { EventSubscribersLoader } from './services/event-subscribers-loader.service';
import type { IEventEmitterConfig } from './interfaces';

// ════════════════════════════════════════════════════════════════════════════════
// Module
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Event emitter DI module.
 *
 * Registers the EventEmitter as a global singleton with configurable
 * wildcard matching, max listeners, and delimiter. Also registers
 * the auto-discovery loader for `@OnEvent` and `@EventTransport`.
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [
 *     EventEmitterModule.forRoot({
 *       wildcard: true,
 *       delimiter: '.',
 *       maxListeners: 20,
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class EventEmitterModule {
  /**
   * Configure the event emitter module with static options.
   *
   * @param config - Event emitter configuration
   * @returns Dynamic module definition
   */
  public static forRoot(config?: IEventEmitterConfig): IDynamicModule {
    const mergedConfig: IEventEmitterConfig = {
      wildcard: config?.wildcard ?? false,
      delimiter: config?.delimiter ?? '.',
      maxListeners: config?.maxListeners ?? 10,
      global: config?.global ?? true,
    };

    return {
      module: EventEmitterModule,
      global: mergedConfig.global,
      providers: [
        // Config
        { provide: EVENT_EMITTER_CONFIG_TOKEN, useValue: mergedConfig },

        // EventEmitter singleton
        EventEmitter,
        { provide: EVENT_EMITTER_TOKEN, useExisting: EventEmitter },

        // Transport registry
        EventTransportRegistry,
        { provide: EVENT_TRANSPORT_REGISTRY_TOKEN, useExisting: EventTransportRegistry },

        // Auto-discovery loader (runs onModuleInit)
        EventSubscribersLoader,
      ],
      exports: [
        EVENT_EMITTER_CONFIG_TOKEN,
        EventEmitter,
        EVENT_EMITTER_TOKEN,
        EventTransportRegistry,
        EVENT_TRANSPORT_REGISTRY_TOKEN,
      ],
    };
  }

  /**
   * Configure the event emitter module with async factory.
   *
   * @param options - Async options with useFactory and inject
   * @returns Dynamic module definition
   */
  public static forRootAsync(options: {
    useFactory: (...args: unknown[]) => IEventEmitterConfig | Promise<IEventEmitterConfig>;
    inject?: unknown[];
  }): IDynamicModule {
    return {
      module: EventEmitterModule,
      global: true,
      providers: [
        {
          provide: EVENT_EMITTER_CONFIG_TOKEN,
          useFactory: options.useFactory,
          inject: (options.inject ?? []) as any[],
        },
        EventEmitter,
        { provide: EVENT_EMITTER_TOKEN, useExisting: EventEmitter },
        EventTransportRegistry,
        { provide: EVENT_TRANSPORT_REGISTRY_TOKEN, useExisting: EventTransportRegistry },
        EventSubscribersLoader,
      ],
      exports: [
        EVENT_EMITTER_CONFIG_TOKEN,
        EventEmitter,
        EVENT_EMITTER_TOKEN,
        EventTransportRegistry,
        EVENT_TRANSPORT_REGISTRY_TOKEN,
      ],
    };
  }
}
