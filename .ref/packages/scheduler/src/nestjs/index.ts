/**
 * @file index.ts
 * @module @stackra/scheduler/nestjs
 * @description NestJS subpath for the scheduler module.
 */

// ════════════════════════════════════════════════════════════════════════════════
// NestJS Module
// ════════════════════════════════════════════════════════════════════════════════
export { NestSchedulerModule } from './nest-scheduler.module';

// ════════════════════════════════════════════════════════════════════════════════
// Re-export core
// ════════════════════════════════════════════════════════════════════════════════
export {
  SchedulerModule,
  type SchedulerModuleOptions,
  SchedulerService,
  SCHEDULER_EVENTS,
  DefaultTaskRunner,
  ScheduledTaskLoader,
  Scheduled,
  type ScheduledOptions,
  defineConfig,
  parseCron,
  getNextCronTime,
  getNextCronDelay,
  TASK_RUNNER,
  SCHEDULER_SERVICE,
  SCHEDULED_METADATA_KEY,
} from '../core';
export type { ITaskRunner, ScheduledTask, TaskOptions, ITaskLifecycleHooks } from '../core';
