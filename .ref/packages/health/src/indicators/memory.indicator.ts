/**
 * @file memory.indicator.ts
 * @module @stackra/nestjs-health/indicators
 * @description Built-in memory usage health indicator.
 *
 * Reports heap, RSS, and external memory usage. Returns `degraded` when usage
 * exceeds 80% of the threshold, and `down` when usage exceeds the threshold.
 */

import { IInjectable, Inject, Optional } from '@nestjs/common';
import { HealthStatus, HealthProbe } from '@stackra/contracts';
import type { IHealthIndicator, HealthIndicatorResult } from '@stackra/contracts';
import { HealthIndicator } from '../decorators';
import {
  HEALTH_MODULE_OPTIONS,
  DEFAULT_HEAP_THRESHOLD,
  DEFAULT_RSS_THRESHOLD,
  DEGRADATION_RATIO,
} from '../constants';
import type { IHealthModuleOptions } from '../interfaces';

/**
 * Memory health indicator.
 *
 * Checks V8 heap and RSS memory usage against configurable thresholds.
 * Assigned to the liveness probe by default — high memory often indicates
 * a leak that will eventually crash the process.
 */
@HealthIndicator('memory', { probes: [HealthProbe.LIVENESS] })
export class MemoryHealthIndicator implements IHealthIndicator {
  private readonly heapThreshold: number;
  private readonly rssThreshold: number;

  /**
   * @param options - Module configuration for threshold values
   */
  public constructor(@Optional() @Inject(HEALTH_MODULE_OPTIONS) options?: IHealthModuleOptions) {
    this.heapThreshold = options?.memory?.heapThreshold ?? DEFAULT_HEAP_THRESHOLD;
    this.rssThreshold = options?.memory?.rssThreshold ?? DEFAULT_RSS_THRESHOLD;
  }

  /**
   * Check memory usage against thresholds.
   *
   * @param key - Result key (defaults to 'memory')
   * @returns Indicator result with memory metrics in metadata
   */
  public async check(key?: string): Promise<HealthIndicatorResult> {
    const k = key ?? 'memory';
    const usage = process.memoryUsage();

    const heapUsed = usage.heapUsed;
    const rss = usage.rss;
    const external = usage.external;

    // Determine status based on worst of heap and RSS
    let status = HealthStatus.UP;

    if (heapUsed > this.heapThreshold || rss > this.rssThreshold) {
      status = HealthStatus.DOWN;
    } else if (
      heapUsed > this.heapThreshold * DEGRADATION_RATIO ||
      rss > this.rssThreshold * DEGRADATION_RATIO
    ) {
      status = HealthStatus.DEGRADED;
    }

    return {
      [k]: {
        status,
        heapUsed,
        heapThreshold: this.heapThreshold,
        rss,
        rssThreshold: this.rssThreshold,
        external,
      },
    };
  }
}
