/**
 * @file indicator-loader.service.ts
 * @module @stackra/nestjs-health/services
 * @description Auto-discovers @HealthIndicator() decorated classes at module init.
 *
 * Uses the platform-agnostic IDiscoveryService (from @stackra/contracts) to
 * scan all providers for indicator metadata and registers them in the
 * IndicatorRegistry. Discovery happens in `onModuleInit()` per
 * container-patterns steering.
 *
 * Requires `NestContainerModule.forRoot()` (from `@stackra/ts-container/nestjs`)
 * to be imported once at the app root to provide the DISCOVERY_SERVICE token.
 * If not available, degrades gracefully — indicators can still be registered manually.
 */

import { IInjectable, Optional, Inject, type IOnModuleInit, Logger } from '@nestjs/common';
import { getMetadata } from '@vivtel/metadata';
import {
  DISCOVERY_SERVICE,
  HEALTH_INDICATOR_METADATA_KEY,
  HealthProbe,
  type IDiscoveryService,
  type IHealthIndicator,
} from '@stackra/contracts';
import { IndicatorRegistry } from '../registries';
import { InvalidIndicatorNameError } from '../errors';
import { isValidIndicatorName } from '../utils';
import type { IHealthIndicatorMetadata } from '../decorators';

/**
 * Loads health indicators at module initialization via IDiscoveryService.
 *
 * Scans all providers for classes decorated with `@HealthIndicator()`,
 * validates their names, and registers them in the IndicatorRegistry.
 *
 * Discovery happens in `onModuleInit()` per the container-patterns steering —
 * at this point all providers in the module are resolved and ready.
 *
 * If DISCOVERY_SERVICE is not available (NestContainerModule not imported),
 * this service is a no-op — indicators must be registered manually or
 * via `NestHealthModule.forFeature()`.
 */
@IInjectable()
export class IndicatorLoaderService implements IOnModuleInit {
  private readonly logger = new Logger(IndicatorLoaderService.name);

  /**
   * @param discovery - Platform-agnostic discovery service (from NestContainerModule)
   * @param registry - The indicator registry to populate
   */
  public constructor(
    @Optional()
    @Inject(DISCOVERY_SERVICE)
    private readonly discovery: IDiscoveryService | undefined,
    private readonly registry: IndicatorRegistry
  ) {}

  /**
   * Scan all providers for @HealthIndicator() metadata and register them.
   *
   * Runs during the `IOnModuleInit` lifecycle hook — all providers in the module
   * are resolved at this point.
   */
  public onModuleInit(): void {
    if (!this.discovery) {
      this.logger.warn(
        'DISCOVERY_SERVICE not available — health indicators will not be auto-discovered. ' +
          'Import NestContainerModule.forRoot() in your root module to enable auto-discovery.'
      );
      return;
    }

    const providers = this.discovery.getProvidersByMetadata(HEALTH_INDICATOR_METADATA_KEY);

    for (const { instance, metatype } of providers) {
      if (!instance || !metatype) continue;

      const metadata = getMetadata<IHealthIndicatorMetadata>(
        HEALTH_INDICATOR_METADATA_KEY,
        metatype
      );

      if (!metadata) continue;

      // Validate indicator name
      if (!isValidIndicatorName(metadata.name)) {
        throw new InvalidIndicatorNameError(metadata.name, metatype.name);
      }

      // Determine probe assignments (default to all if not specified)
      const probes = metadata.options.probes?.length
        ? metadata.options.probes
        : [HealthProbe.LIVENESS, HealthProbe.READINESS, HealthProbe.STARTUP];

      this.registry.register({
        name: metadata.name,
        probes,
        classRef: metatype as any,
        instance: instance as IHealthIndicator,
        metadata: metadata.options.metadata,
        when: metadata.options.when,
        timeout: metadata.options.timeout,
        retry: metadata.options.retry,
        schedule: metadata.options.schedule,
      });

      this.logger.debug(
        `Registered health indicator "${metadata.name}" → probes: [${probes.join(', ')}]`
      );
    }

    this.logger.log(`Discovered ${this.registry.size} health indicator(s).`);
  }
}
