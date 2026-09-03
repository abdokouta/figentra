/**
 * @file process-uptime.indicator.ts
 * @module @stackra/nestjs-health/indicators
 * @description Built-in process uptime health indicator.
 *
 * Informational indicator that always returns `up`. Reports uptime
 * in seconds and the process start time for detecting unexpected restarts.
 */

import { IInjectable } from '@nestjs/common';
import { HealthStatus, HealthProbe } from '@stackra/contracts';
import type { IHealthIndicator, HealthIndicatorResult } from '@stackra/contracts';
import { HealthIndicator } from '../decorators';

/**
 * Process uptime health indicator.
 *
 * Always returns `up`. Reports process uptime and start time.
 * Useful for detecting unexpected restarts. Assigned to liveness probe.
 */
@HealthIndicator('process-uptime', { probes: [HealthProbe.LIVENESS] })
export class ProcessUptimeIndicator implements IHealthIndicator {
  /**
   * Report process uptime.
   *
   * @param key - Result key (defaults to 'process-uptime')
   * @returns Indicator result with uptime and start time
   */
  public async check(key?: string): Promise<HealthIndicatorResult> {
    const k = key ?? 'process-uptime';
    const uptimeSeconds = Math.round(process.uptime() * 1000) / 1000;
    const startedAt = new Date(Date.now() - uptimeSeconds * 1000).toISOString();

    return {
      [k]: {
        status: HealthStatus.UP,
        uptimeSeconds,
        startedAt,
      },
    };
  }
}
