/**
 * @file nest-scheduler.module.ts
 * @module @stackra/scheduler/nestjs
 * @description NestJS module wrapper for the scheduler system.
 *   Imports the core SchedulerModule. For server-side cron-style scheduling,
 *   use BullMQ repeatable jobs via `@stackra/queue`'s `queueService.schedule()`.
 *   This module provides foreground interval-based tasks.
 */

import { Module, type IDynamicModule } from '@nestjs/common';
import { SchedulerModule, type SchedulerModuleOptions } from '../core/scheduler.module';

/**
 * NestJS scheduler module — thin wrapper over core.
 *
 * The core `SchedulerModule.forRoot()` is already NestJS-compatible.
 * This wrapper exists for naming consistency and to add NestJS-specific
 * features in the future (e.g., health indicators for scheduled tasks).
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [
 *     NestSchedulerModule.forRoot({
 *       tasks: [
 *         { name: 'cleanup', fn: async () => cleanup(), options: { interval: 3600000 } },
 *       ],
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class NestSchedulerModule {
  /**
   * Register the NestJS scheduler module globally.
   *
   * @param options - Scheduler configuration (passed through to core)
   * @returns Dynamic module definition
   */
  public static forRoot(options?: SchedulerModuleOptions): IDynamicModule {
    return {
      module: NestSchedulerModule,
      global: true,
      imports: [SchedulerModule.forRoot(options)],
    };
  }
}
