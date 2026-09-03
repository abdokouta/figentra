/**
 * @file disk.indicator.ts
 * @module @stackra/nestjs-health/indicators
 * @description Built-in disk space health indicator.
 *
 * Reports disk usage percentage and available bytes on the configured path.
 * Returns `degraded` at 80% of threshold, `down` when threshold is exceeded.
 */

import { IInjectable, Inject, Optional } from '@nestjs/common';
import { statfs } from 'node:fs/promises';
import { HealthStatus, HealthProbe } from '@stackra/contracts';
import type { IHealthIndicator, HealthIndicatorResult } from '@stackra/contracts';
import { HealthIndicator } from '../decorators';
import {
  HEALTH_MODULE_OPTIONS,
  DEFAULT_DISK_PATH,
  DEFAULT_DISK_THRESHOLD_PERCENT,
  DEGRADATION_RATIO,
} from '../constants';
import type { IHealthModuleOptions } from '../interfaces';

/**
 * Disk space health indicator.
 *
 * Monitors filesystem usage on the configured path. Assigned to the readiness
 * probe by default — running out of disk prevents writing logs, temp files, etc.
 */
@HealthIndicator('disk', { probes: [HealthProbe.READINESS] })
export class DiskHealthIndicator implements IHealthIndicator {
  private readonly path: string;
  private readonly thresholdPercent: number;

  /**
   * @param options - Module configuration for path and threshold
   */
  public constructor(@Optional() @Inject(HEALTH_MODULE_OPTIONS) options?: IHealthModuleOptions) {
    this.path = options?.disk?.path ?? DEFAULT_DISK_PATH;
    this.thresholdPercent = options?.disk?.threshold ?? DEFAULT_DISK_THRESHOLD_PERCENT;
  }

  /**
   * Check disk usage against threshold.
   *
   * @param key - Result key (defaults to 'disk')
   * @returns Indicator result with disk metrics in metadata
   */
  public async check(key?: string): Promise<HealthIndicatorResult> {
    const k = key ?? 'disk';

    try {
      const stats = await statfs(this.path);
      const totalBytes = stats.blocks * stats.bsize;
      const availableBytes = stats.bavail * stats.bsize;
      const usedBytes = totalBytes - availableBytes;
      const usagePercent = totalBytes > 0 ? Math.round((usedBytes / totalBytes) * 100) : 0;

      let status = HealthStatus.UP;

      if (usagePercent > this.thresholdPercent) {
        status = HealthStatus.DOWN;
      } else if (usagePercent > this.thresholdPercent * DEGRADATION_RATIO) {
        status = HealthStatus.DEGRADED;
      }

      return {
        [k]: {
          status,
          usagePercent,
          totalBytes,
          availableBytes,
          path: this.path,
          threshold: this.thresholdPercent,
        },
      };
    } catch (err: Error | any) {
      return {
        [k]: {
          status: HealthStatus.DOWN,
          message: `Cannot access path "${this.path}": ${(err as Error).message}`,
          path: this.path,
        },
      };
    }
  }
}
