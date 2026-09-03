/**
 * @file web-events.module.ts
 * @module @stackra/events/react
 * @description `WebEventEmitterModule` — the React/web-runtime
 *   binding on top of {@link EventEmitterModule}. Thin composition
 *   wrapper.
 */

import { Module, type DynamicModule } from "@stackra/container";

import type { IEventEmitterConfig } from "../core/interfaces";
import type { IConfigModuleAsyncOptions } from "@stackra/contracts";

import { EventEmitterModule } from "../core/events.module";

/**
 * Async options accepted by {@link WebEventEmitterModule.forRootAsync}.
 */
export interface IWebEventsModuleAsyncOptions {
  readonly eventsOptions: IConfigModuleAsyncOptions<IEventEmitterConfig>;
}

/**
 * Web-runtime binding for `@stackra/events`.
 */
@Module({})
export class WebEventEmitterModule {
  /**
   * Sync entry point. Config is optional (core emitter reads
   * field-level defaults when unset).
   */
  public static forRoot(config?: IEventEmitterConfig): DynamicModule {
    return {
      module: WebEventEmitterModule,
      global: true,
      imports: [EventEmitterModule.forRoot(config)],
      exports: [EventEmitterModule],
    };
  }

  /**
   * Async entry point.
   */
  public static forRootAsync(
    options: IWebEventsModuleAsyncOptions,
  ): DynamicModule {
    return {
      module: WebEventEmitterModule,
      global: true,
      imports: [EventEmitterModule.forRootAsync(options.eventsOptions)],
      exports: [EventEmitterModule],
    };
  }
}
