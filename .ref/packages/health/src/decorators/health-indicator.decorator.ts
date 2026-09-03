/**
 * @file health-indicator.decorator.ts
 * @module @stackra/nestjs-health/decorators
 * @description Class decorator for marking a service as a health indicator.
 *
 * Classes decorated with `@HealthIndicator()` are auto-discovered at bootstrap
 * time by the IndicatorLoaderService and registered in the IndicatorRegistry.
 */

import { defineMetadata } from '@vivtel/metadata';
import { HEALTH_INDICATOR_METADATA_KEY } from '@stackra/contracts';
import type { HealthProbe } from '@stackra/contracts';
import { IInjectable } from '@nestjs/common';

/**
 * Mark a class as a health indicator for auto-discovery.
 *
 * The class must implement the `IHealthIndicator` interface (at minimum a
 * `check(key?: string)` method). It will be discovered at bootstrap and
 * registered in the IndicatorRegistry.
 *
 * @param name - Unique indicator name (1-64 chars, [a-zA-Z0-9_-])
 * @param options - Optional configuration (probes, timeout, retry, when)
 * @returns Class decorator
 *
 * @example
 * ```typescript
 * @HealthIndicator('redis', { probes: [HealthProbe.READINESS, HealthProbe.STARTUP] })
 * @IInjectable()
 * export class RedisHealthIndicator implements IHealthIndicator {
 *   async check(key?: string) {
 *     return { [key ?? 'redis']: { status: 'up', responseTimeMs: 2 } };
 *   }
 * }
 * ```
 */
export function HealthIndicator(
  name: string,
  options: IHealthIndicatorDecoratorOptions = {}
): ClassDecorator {
  return (target: Function) => {
    IInjectable()(target);

    const metadata: IHealthIndicatorMetadata = { name, options };
    defineMetadata(HEALTH_INDICATOR_METADATA_KEY, metadata, target);
  };
}
