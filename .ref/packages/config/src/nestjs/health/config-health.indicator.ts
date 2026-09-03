/**
 * @file config-health.indicator.ts
 * @module @stackra/config/nestjs/health
 * @description Health indicator for config sources.
 *   Reports the status of all async config sources (HTTP, secrets).
 *   Integrates with @stackra/nestjs-health.
 */

import { IInjectable, Inject } from '@nestjs/common';

import { CONFIG_MANAGER } from '@stackra/contracts';
import type { IHealthIndicator, HealthIndicatorResult } from '@stackra/contracts';
import type { ConfigManager } from '../../core/services/config-manager.service';

// ════════════════════════════════════════════════════════════════════════════════
// Health Indicator
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Config health indicator.
 *
 * Checks connectivity to all configured config sources and reports their
 * health status. Reports 'up' when all sources are accessible, 'down'
 * when any source fails.
 *
 * Integrates with `@stackra/nestjs-health` health check system.
 *
 * @example
 * ```typescript
 * // In a health module:
 * @Module({
 *   providers: [ConfigHealthIndicator],
 * })
 * export class HealthModule {}
 * ```
 */
@IInjectable()
export class ConfigHealthIndicator implements IHealthIndicator {
  /**
   * @param configManager - The config manager to health-check
   */
  public constructor(@Inject(CONFIG_MANAGER) private readonly configManager: ConfigManager) {}

  /**
   * Check health of all config sources.
   *
   * @param key - The health indicator key (e.g., 'config')
   * @returns Health indicator result
   */
  public async check(key: string = 'config'): Promise<HealthIndicatorResult> {
    const sourceNames = this.configManager.getSourceNames();
    const details: Record<string, unknown> = {};
    let isHealthy = true;

    for (const sourceName of sourceNames) {
      try {
        const service = await this.configManager.sourceAsync(sourceName);
        const keys = Object.keys(service.all());
        details[sourceName] = {
          status: 'up',
          keys: keys.length,
        };
      } catch (error: Error | any) {
        isHealthy = false;
        details[sourceName] = {
          status: 'down',
          error: (error as Error).message,
        };
      }
    }

    return {
      [key]: {
        status: isHealthy ? 'up' : 'down',
        details,
      },
    };
  }
}
