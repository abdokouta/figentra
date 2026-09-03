/**
 * @file scheduler.module.ts
 * @module @stackra/scheduler/core
 * @description DI module for task scheduling.
 */

import { Module, type DynamicModule } from "@stackra/container";
import {
  SCHEDULER_SERVICE,
  TASK_RUNNER,
  type IConfigModuleAsyncOptions,
} from "@stackra/contracts";

import { SCHEDULER_CONFIG } from "@stackra/contracts";
import { SchedulerService } from "./services/scheduler.service";
import { DefaultTaskRunner } from "./services/default-task-runner.service";
import { ScheduledTaskLoader } from "./services/scheduled-task-loader.service";

import type { ISchedulerModuleOptions } from "./interfaces/scheduler-module-options.interface";

/**
 * Scheduler DI module.
 */
@Module({})
export class SchedulerModule {
  /** Sync entry point. */
  public static forRoot(config: ISchedulerModuleOptions = {}): DynamicModule {
    const runnerProvider = config.runner
      ? { provide: TASK_RUNNER, useValue: config.runner }
      : { provide: TASK_RUNNER, useClass: DefaultTaskRunner };

    return {
      module: SchedulerModule,
      global: true,
      providers: [
        { provide: SCHEDULER_CONFIG, useValue: config },
        runnerProvider,
        SchedulerService,
        { provide: SCHEDULER_SERVICE, useExisting: SchedulerService },
        ScheduledTaskLoader,
      ],
      exports: [TASK_RUNNER, SCHEDULER_SERVICE, SchedulerService],
    };
  }

  /** Async entry point — accepts the exact `.asProvider()` output. */
  public static forRootAsync(
    options: IConfigModuleAsyncOptions<ISchedulerModuleOptions>,
  ): DynamicModule {
    return {
      module: SchedulerModule,
      global: true,
      imports: options.imports ?? [],
      providers: [
        {
          provide: SCHEDULER_CONFIG,
          useFactory: options.useFactory,
          inject: options.inject ?? [],
        },
        {
          provide: TASK_RUNNER,
          useFactory: (config: ISchedulerModuleOptions) =>
            config.runner ?? new DefaultTaskRunner(),
          inject: [SCHEDULER_CONFIG],
        },
        SchedulerService,
        { provide: SCHEDULER_SERVICE, useExisting: SchedulerService },
        ScheduledTaskLoader,
      ],
      exports: [TASK_RUNNER, SCHEDULER_SERVICE, SchedulerService],
    };
  }
}
