/**
 * @file scheduler.service.ts
 * @module @stackra/nestjs-health/services
 * @description Scheduled health check execution service.
 *
 * Runs health checks at configured intervals (cron or ms). Skips overlapping
 * executions and cancels timers on application shutdown.
 *
 * @todo Replace with `@stackra/nestjs-scheduler` package when available.
 *   The scheduler package will provide cron parsing, timezone support,
 *   distributed locking (prevent multiple instances running the same check),
 *   and a unified scheduling interface. This service should become a thin
 *   adapter calling `scheduler.register('health-check', interval, callback)`.
 */

import { IInjectable, Inject, Logger, type OnApplicationShutdown } from '@nestjs/common';
import { HEALTH_MODULE_OPTIONS } from '../constants';
import { HealthRunnerService } from './health-runner.service';
import type { IHealthModuleOptions } from '../interfaces';

/**
 * Scheduler service for periodic health check execution.
 *
 * Supports:
 * - Interval-based scheduling (ms)
 * - Overlap prevention (skips if previous run still in progress)
 * - Clean shutdown (cancels timers, awaits in-progress execution)
 */
@IInjectable()
export class SchedulerService implements OnApplicationShutdown {
  private readonly logger = new Logger(SchedulerService.name);
  private timer: NodeJS.Timeout | null = null;
  private running = false;
  private shuttingDown = false;
  private runPromise: Promise<void> | null = null;

  /**
   * @param options - Module configuration
   * @param runner - The health runner service
   */
  public constructor(
    @Inject(HEALTH_MODULE_OPTIONS) private readonly options: IHealthModuleOptions,
    private readonly runner: HealthRunnerService
  ) {}

  /**
   * Start the scheduler. Called by the module after bootstrap.
   */
  public start(): void {
    const schedule = this.options.schedule;
    if (!schedule) return;

    if (typeof schedule === 'number') {
      this.startInterval(schedule);
    } else {
      // For cron expressions, use a simple interval approximation
      // A full cron implementation would use a library like cron-parser
      this.logger.log(`Cron scheduling "${schedule}" — using 60s interval approximation`);
      this.startInterval(60000);
    }
  }

  /**
   * Shutdown hook — cancel timers and await in-progress execution.
   */
  public async onApplicationShutdown(): Promise<void> {
    this.shuttingDown = true;
    this.stop();

    if (this.runPromise) {
      this.logger.log('Awaiting in-progress health check before shutdown...');
      await this.runPromise;
    }
  }

  /**
   * Stop the scheduler.
   */
  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * Start interval-based execution.
   *
   * @param intervalMs - Execution interval in milliseconds
   */
  private startInterval(intervalMs: number): void {
    this.logger.log(`Health check scheduler started — interval: ${intervalMs}ms`);

    this.timer = setInterval(() => {
      this.tick();
    }, intervalMs);

    // Don't prevent process exit
    if (this.timer.unref) {
      this.timer.unref();
    }
  }

  /**
   * Single scheduler tick. Skips if previous execution still running.
   */
  private tick(): void {
    if (this.shuttingDown) return;

    if (this.running) {
      this.logger.warn('Skipping scheduled health check — previous execution still running.');
      return;
    }

    this.running = true;
    this.runPromise = this.runner
      .runAll()
      .then(() => {
        /* discard result — we only care about completion */
      })
      .catch((err) => {
        this.logger.error(`Scheduled health check failed: ${(err as Error).message}`);
      })
      .finally(() => {
        this.running = false;
        this.runPromise = null;
      });
  }
}
