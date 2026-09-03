/**
 * @file logger-health.indicator.ts
 * @module @stackra/logger/nestjs/health
 * @description Logger health indicator — reports on reporter status,
 *   buffer levels, and last error time. Simple interface (not @nestjs/terminus).
 */

import { Injectable, Inject } from '@nestjs/common';
import { LOGGER_MANAGER, type ILoggerManager } from '@stackra/contracts';

/**
 * Logger health indicator — provides a simple health check endpoint.
 *
 * Reports on:
 * - Number and names of registered reporters
 * - Default channel and total channel count
 * - Last known reporter error (if any)
 *
 * This is a standalone health indicator (not tied to @nestjs/terminus)
 * for maximum portability. Integrate with your health check endpoint
 * by calling `check()`.
 *
 * @example
 * ```typescript
 * @Controller('health')
 * export class HealthController {
 *   constructor(private readonly loggerHealth: LoggerHealthIndicator) {}
 *
 *   @Get('logger')
 *   check() {
 *     return this.loggerHealth.check();
 *   }
 * }
 * ```
 */
@Injectable()
export class LoggerHealthIndicator {
  /** Timestamp of the last known reporter error. */
  private lastErrorTime: string | null = null;

  /**
   * @param manager - LoggerManager instance
   */
  public constructor(@Inject(LOGGER_MANAGER) private readonly manager: ILoggerManager) {}

  /**
   * Perform a health check on the logger system.
   *
   * @returns Health check result with status and details
   */
  public check(): ILoggerHealthResult {
    const reporters = (this.manager as any).getReporterNames?.() ?? [];
    const channels = (this.manager as any).config?.channels ?? {};
    const defaultChannel = (this.manager as any).getDefaultDriver?.() ?? 'unknown';

    const channelCount = Object.keys(channels).length;
    const reporterCount = reporters.length;

    // Determine status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (reporterCount === 0) {
      status = 'unhealthy';
    } else if (this.lastErrorTime) {
      const errorAge = Date.now() - new Date(this.lastErrorTime).getTime();
      // If error was within last 5 minutes, mark as degraded
      if (errorAge < 5 * 60 * 1000) {
        status = 'degraded';
      }
    }

    return {
      status,
      details: {
        reporterCount,
        reporters,
        defaultChannel,
        channelCount,
        lastErrorTime: this.lastErrorTime,
      },
    };
  }

  /**
   * Record a reporter error timestamp.
   * Called internally when a reporter fails.
   */
  public recordError(): void {
    this.lastErrorTime = new Date().toISOString();
  }
}
