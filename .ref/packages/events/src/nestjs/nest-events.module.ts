/**
 * @file nest-events.module.ts
 * @module @stackra/events/nestjs
 * @description NestJS module wrapper for the event system.
 *   Imports the core `EventEmitterModule` and adds NestJS-specific features:
 *   - Uses NestJS `DiscoveryModule` for `@OnEvent` / `@EventTransport` scanning
 *
 *   The core `EventEmitterModule.forRoot()` already works in NestJS (ts-container
 *   decorators are NestJS-compatible). This wrapper adds NestJS's DiscoveryService
 *   so the `EventSubscribersLoader` can scan all registered providers.
 */

import { Module, type IDynamicModule } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { EventEmitterModule } from '../core/events.module';
import type { IEventEmitterConfig } from '../core/interfaces';

// ════════════════════════════════════════════════════════════════════════════════
// Module
// ════════════════════════════════════════════════════════════════════════════════

/**
 * NestJS events module — thin wrapper over the core module.
 *
 * Adds NestJS `DiscoveryModule` so `EventSubscribersLoader` can
 * discover all `@OnEvent` and `@EventTransport` providers using
 * NestJS's `DiscoveryService`.
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [
 *     NestEventsModule.forRoot({
 *       wildcard: true,
 *       maxListeners: 20,
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class NestEventsModule {
  /**
   * Register the NestJS events module globally.
   *
   * Imports the core `EventEmitterModule.forRoot()` and adds
   * NestJS DiscoveryModule for provider scanning.
   *
   * @param config - Event emitter configuration (passed through to core)
   * @returns Dynamic module definition
   */
  public static forRoot(config?: IEventEmitterConfig): IDynamicModule {
    return {
      module: NestEventsModule,
      global: true,
      imports: [DiscoveryModule, EventEmitterModule.forRoot(config)],
    };
  }
}
