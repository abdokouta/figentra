/**
 * @file nest-queue.module.ts
 * @module @stackra/queue/nestjs
 * @description NestJS queue module — wraps the core QueueModule.
 *   For BullMQ integration, the NestJS app imports @nestjs/bullmq directly.
 *   This module provides the core QueueManager for cross-stack compatibility.
 */

import { Module, type IDynamicModule } from '@nestjs/common';
import { QueueModule } from '../core/queue.module';
import type { IQueueModuleOptions } from '../core/interfaces';

/**
 * NestJS queue module — imports core and provides QueueManager globally.
 *
 * For production BullMQ usage, apps should ALSO import `@nestjs/bullmq`
 * alongside this module (the QueueManager's `extend()` method registers
 * BullMQ as a custom driver).
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [
 *     NestQueueModule.forRoot({
 *       default: 'memory',
 *       connections: { memory: { driver: 'memory' } },
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class NestQueueModule {
  /**
   * Register the NestJS queue module globally.
   *
   * @param config - Queue configuration (passed to core)
   * @returns Dynamic module definition
   */
  public static forRoot(config: IQueueModuleOptions): IDynamicModule {
    return {
      module: NestQueueModule,
      global: true,
      imports: [QueueModule.forRoot(config)],
    };
  }
}
