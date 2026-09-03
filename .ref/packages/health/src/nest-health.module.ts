/**
 * @file nest-health.module.ts
 * @module @stackra/nestjs-health
 * @description Production-ready health check module for NestJS.
 *
 * Provides Kubernetes probe endpoints, auto-discovery of @HealthIndicator() classes,
 * 10 built-in indicators, pluggable result storage, scheduled execution,
 * status transition events via IPubSubDriver, and an admin API.
 *
 * @example
 * ```typescript
 * import { NestHealthModule } from '@stackra/nestjs-health';
 *
 * @Module({
 *   imports: [
 *     NestHealthModule.forRoot({
 *       memory: { heapThreshold: 512 * 1024 * 1024 },
 *       schedule: 30000, // check every 30s
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */

import { Module, type IDynamicModule, type IType } from '@nestjs/common';
import type { IHealthIndicator } from '@stackra/contracts';
import { HEALTH_MODULE_OPTIONS, HEALTH_RESULT_STORE, HEALTH_METRICS } from './constants';
import { validateConfig, deepMerge } from './utils';
import { DuplicateModuleError } from './errors';
import { IndicatorRegistry } from './registries';
import {
  HealthRunnerService,
  IndicatorLoaderService,
  CooldownTrackerService,
  SchedulerService,
} from './services';
import { InMemoryResultStore } from './stores';
import { createHealthController } from './factories';
import {
  MemoryHealthIndicator,
  DiskHealthIndicator,
  EventLoopLagIndicator,
  ProcessUptimeIndicator,
} from './indicators';
import type { IHealthModuleOptions } from './interfaces';

/**
 * Default configuration values.
 */
const DEFAULTS: IHealthModuleOptions = {
  basePath: 'health',
  probes: { liveness: true, readiness: true, startup: true },
  execution: { mode: 'parallel', concurrency: 5, timeout: 5000 },
  notification: { cooldown: 300 },
  admin: true,
};

/**
 * NestHealthModule — production-ready health monitoring for NestJS.
 *
 * Call `NestHealthModule.forRoot()` once in your root AppModule.
 * Indicators decorated with `@HealthIndicator()` are auto-discovered.
 */
@Module({})
export class NestHealthModule {
  private static registered = false;

  /**
   * Register the health module globally with configuration.
   *
   * @param options - Module configuration (all fields optional)
   * @returns Global dynamic module
   * @throws {DuplicateModuleError} If called more than once
   * @throws {InvalidConfigError} If configuration values are invalid
   */
  public static forRoot(options: IHealthModuleOptions = {}): IDynamicModule {
    if (NestHealthModule.registered) {
      throw new DuplicateModuleError();
    }
    NestHealthModule.registered = true;

    // Merge with defaults
    const merged = deepMerge(
      DEFAULTS as Record<string, unknown>,
      options as Record<string, unknown>
    ) as IHealthModuleOptions;

    // Validate
    validateConfig(merged);

    // Configure cooldown
    const cooldownSeconds = merged.notification?.cooldown ?? 300;

    // Result store
    const ResultStoreClass = merged.resultStore ?? InMemoryResultStore;

    // Dynamic controller
    const DynamicController = createHealthController(merged);

    const providers: any[] = [
      // Config token
      { provide: HEALTH_MODULE_OPTIONS, useValue: merged },

      // Core services
      IndicatorRegistry,
      IndicatorLoaderService,
      {
        provide: CooldownTrackerService,
        useFactory: () => {
          const tracker = new CooldownTrackerService();
          tracker.setCooldown(cooldownSeconds);
          return tracker;
        },
      },
      HealthRunnerService,
      SchedulerService,

      // Result store
      { provide: HEALTH_RESULT_STORE, useClass: ResultStoreClass },

      // Metrics (optional — null if not provided)
      {
        provide: HEALTH_METRICS,
        useValue: merged.metrics ?? null,
      },

      // Built-in foundational indicators
      MemoryHealthIndicator,
      DiskHealthIndicator,
      EventLoopLagIndicator,
      ProcessUptimeIndicator,
    ];

    return {
      module: NestHealthModule,
      global: true,
      imports: [],
      controllers: [DynamicController],
      providers,
      exports: [
        IndicatorRegistry,
        HealthRunnerService,
        SchedulerService,
        HEALTH_RESULT_STORE,
        HEALTH_MODULE_OPTIONS,
      ],
    };
  }

  /**
   * Register the health module with async configuration.
   *
   * @param asyncOptions - Async module options (factory, useClass, useExisting)
   * @returns Global dynamic module
   */
  public static forRootAsync(asyncOptions: {
    useFactory: (...args: any[]) => IHealthModuleOptions | Promise<IHealthModuleOptions>;
    inject?: any[];
  }): IDynamicModule {
    if (NestHealthModule.registered) {
      throw new DuplicateModuleError();
    }
    NestHealthModule.registered = true;

    const configProvider = {
      provide: HEALTH_MODULE_OPTIONS,
      useFactory: async (...args: any[]) => {
        const options = (await asyncOptions.useFactory(...args)) ?? {};
        const merged = deepMerge(
          DEFAULTS as Record<string, unknown>,
          options as Record<string, unknown>
        ) as IHealthModuleOptions;
        validateConfig(merged);
        return merged;
      },
      inject: asyncOptions.inject ?? [],
    };

    const providers: any[] = [
      configProvider,
      IndicatorRegistry,
      IndicatorLoaderService,
      CooldownTrackerService,
      HealthRunnerService,
      SchedulerService,
      {
        provide: HEALTH_RESULT_STORE,
        useClass: InMemoryResultStore,
      },
      {
        provide: HEALTH_METRICS,
        useValue: null,
      },

      // Built-in foundational indicators
      MemoryHealthIndicator,
      DiskHealthIndicator,
      EventLoopLagIndicator,
      ProcessUptimeIndicator,
    ];

    return {
      module: NestHealthModule,
      global: true,
      imports: [],
      controllers: [], // Controller needs basePath from resolved config — use default
      providers,
      exports: [
        IndicatorRegistry,
        HealthRunnerService,
        SchedulerService,
        HEALTH_RESULT_STORE,
        HEALTH_MODULE_OPTIONS,
      ],
    };
  }

  /**
   * Register additional indicator classes from a feature module.
   *
   * @param indicators - Array of indicator classes to register as providers
   * @returns Non-global dynamic module
   */
  public static forFeature(indicators: IType<IHealthIndicator>[]): IDynamicModule {
    return {
      module: NestHealthModule,
      providers: [...indicators],
      exports: [...indicators],
    };
  }

  /**
   * Reset the registered flag (for testing only).
   */
  public static resetForTesting(): void {
    NestHealthModule.registered = false;
  }
}
