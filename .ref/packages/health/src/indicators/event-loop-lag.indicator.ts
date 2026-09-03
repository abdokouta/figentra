/**
 * @file event-loop-lag.indicator.ts
 * @module @stackra/nestjs-health/indicators
 * @description Built-in Node.js event loop lag health indicator.
 */

import { IInjectable, Inject, Optional, type IOnModuleDestroy } from '@nestjs/common';
import { monitorEventLoopDelay, type IntervalHistogram } from 'node:perf_hooks';
import { HealthStatus, HealthProbe } from '@stackra/contracts';
import type { IHealthIndicator, HealthIndicatorResult } from '@stackra/contracts';
import { HealthIndicator } from '../decorators';
import {
  HEALTH_MODULE_OPTIONS,
  DEFAULT_EVENT_LOOP_LAG_THRESHOLD,
  DEFAULT_EVENT_LOOP_RESOLUTION,
  DEGRADATION_RATIO,
} from '../constants';
import type { IHealthModuleOptions } from '../interfaces';

/**
 * Event loop lag health indicator.
 *
 * Measures event loop delay using `monitorEventLoopDelay` from `perf_hooks`.
 * Reports p50, p95, p99 values. Assigned to liveness probe — high event loop
 * lag indicates CPU saturation that will degrade all response times.
 */
@HealthIndicator('event-loop-lag', { probes: [HealthProbe.LIVENESS] })
export class EventLoopLagIndicator implements IHealthIndicator, IOnModuleDestroy {
  private histogram: IntervalHistogram | null = null;
  private readonly threshold: number;

  /**
   * @param options - Module configuration
   */
  public constructor(@Optional() @Inject(HEALTH_MODULE_OPTIONS) _options?: IHealthModuleOptions) {
    this.threshold = DEFAULT_EVENT_LOOP_LAG_THRESHOLD;

    try {
      this.histogram = monitorEventLoopDelay({
        resolution: DEFAULT_EVENT_LOOP_RESOLUTION,
      });
      this.histogram.enable();
    } catch {
      // monitorEventLoopDelay not available in this runtime
      this.histogram = null;
    }
  }

  /**
   * Cleanup the histogram on module destroy.
   */
  public onModuleDestroy(): void {
    if (this.histogram) {
      this.histogram.disable();
    }
  }

  /**
   * Optional shutdown cleanup.
   */
  public async onShutdown(): Promise<void> {
    this.onModuleDestroy();
  }

  /**
   * Check event loop lag against thresholds.
   *
   * @param key - Result key (defaults to 'event-loop-lag')
   * @returns Indicator result with p50/p95/p99 values
   */
  public async check(key?: string): Promise<HealthIndicatorResult> {
    const k = key ?? 'event-loop-lag';

    if (!this.histogram) {
      return {
        [k]: {
          status: HealthStatus.UNKNOWN,
          message: 'monitorEventLoopDelay is not available in this runtime',
        },
      };
    }

    // Values are in nanoseconds, convert to ms
    const p50 = this.histogram.percentile(50) / 1e6;
    const p95 = this.histogram.percentile(95) / 1e6;
    const p99 = this.histogram.percentile(99) / 1e6;

    let status = HealthStatus.UP;

    if (p99 > this.threshold) {
      status = HealthStatus.DOWN;
    } else if (p95 > this.threshold * DEGRADATION_RATIO) {
      status = HealthStatus.DEGRADED;
    }

    // Reset after reading to measure fresh interval
    this.histogram.reset();

    return {
      [k]: {
        status,
        p50Ms: Math.round(p50 * 100) / 100,
        p95Ms: Math.round(p95 * 100) / 100,
        p99Ms: Math.round(p99 * 100) / 100,
        thresholdMs: this.threshold,
      },
    };
  }
}
