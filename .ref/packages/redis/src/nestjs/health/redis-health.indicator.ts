/**
 * @file redis-health.indicator.ts
 * @module @stackra/nestjs-redis/health
 * @description Redis health indicator for `@stackra/nestjs-health`.
 *   Auto-discovered via the `@HealthIndicator()` decorator. Reports
 *   individual connection status with response time metrics.
 */

import { Inject } from '@nestjs/common';
import { Logger } from '@stackra/logger';

import type { IHealthIndicator, IRedisManager, HealthIndicatorResult } from '@stackra/contracts';
import { HealthProbe, REDIS_MANAGER } from '@stackra/contracts';

/**
 * Placeholder HealthIndicator decorator.
 *
 * @todo Replace with import from `@stackra/nestjs-health` once available.
 *
 * @param name - Indicator name.
 * @param _options - Decorator options (unused in placeholder).
 * @returns Class decorator.
 */
function HealthIndicator(name: string, _options?: { probes?: any[] }): ClassDecorator {
  return (_target: Function) => {
    // @todo — metadata registration handled by @stackra/nestjs-health
  };
}

/**
 * Redis health indicator.
 *
 * Auto-discovered by `@stackra/nestjs-health`'s `IndicatorLoaderService`.
 * Checks all configured Redis connections and reports individual status
 * with response time in the standard health check format.
 *
 * Participates in the `readiness` probe — Redis must be reachable for
 * the application to accept traffic.
 *
 * @example
 * ```typescript
 * // Auto-registered when NestRedisModule is imported.
 * // Health endpoint reports:
 * // {
 * //   "redis": {
 * //     "status": "up",
 * //     "main": { "status": "up", "responseTimeMs": 1.23 },
 * //     "cache": { "status": "up", "responseTimeMs": 0.87 }
 * //   }
 * // }
 * ```
 */
@HealthIndicator('redis', { probes: [HealthProbe.READINESS] })
export class RedisHealthIndicator implements IHealthIndicator {
  /** Scoped logger. */
  private readonly logger = new Logger(RedisHealthIndicator.name);

  /**
   * @param manager - Redis manager for health checks.
   */
  public constructor(@Inject(REDIS_MANAGER) private readonly manager: IRedisManager) {}

  /**
   * Execute the health check against all configured Redis connections.
   *
   * Issues a PING command to each connection and reports individual
   * status with response time. The overall status is "up" only if
   * all connections respond successfully.
   *
   * @param key - The health indicator key (default: "redis").
   * @returns Health check result in the standard format.
   */
  public async check(key: string = 'redis'): Promise<HealthIndicatorResult> {
    const names = this.manager.getConnectionNames();
    const results: Record<string, { status: 'up' | 'down'; responseTimeMs?: number }> = {};
    let allHealthy = true;

    for (const name of names) {
      const start = performance.now();

      try {
        const healthy = await this.manager.healthCheck(name);
        const responseTimeMs = Math.round((performance.now() - start) * 100) / 100;

        if (healthy) {
          results[name] = { status: 'up', responseTimeMs };
        } else {
          results[name] = { status: 'down' };
          allHealthy = false;
        }
      } catch (error: unknown) {
        results[name] = { status: 'down' };
        allHealthy = false;
        this.logger.warn(
          `[RedisHealthIndicator] Connection "${name}" health check failed: ${(error as Error).message}`
        );
      }
    }

    return {
      [key]: {
        status: allHealthy ? 'up' : 'down',
        ...results,
      },
    };
  }
}
