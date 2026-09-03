/**
 * @file logger.module.ts
 * @module @stackra/logger/core
 * @description DI module for the logger system.
 *   Registers LoggerManager, built-in reporters, enrichers, and configuration.
 *   Uses auto-discovery via @Reporter decorator — reporters are found and
 *   registered automatically by the ReporterLoader on module init via the
 *   platform-agnostic DISCOVERY_SERVICE (from @stackra/contracts).
 *   Use `LoggerModule.forRoot(config)` in your root application module.
 */

import { Module, type DynamicModule } from '@stackra/ts-container';
import { LOGGER_MANAGER, LOGGER_CONFIG, type ILoggerModuleConfig } from '@stackra/contracts';

import { LoggerManager } from './services/logger-manager.service';
import { ContextRepository } from './services/context-repository.service';
import { LoggerShutdownService } from './services/logger-shutdown.service';
import { ReporterLoader } from './services/reporter-loader.service';
import { ConsoleReporter } from './reporters/console.reporter';
import { JsonReporter } from './reporters/json.reporter';
import { SilentReporter } from './reporters/silent.reporter';
import { RedactionEnricher } from './enrichers/redaction.enricher';
import { InterpolationEnricher } from './enrichers/interpolation.enricher';
import { ContextEnricher } from './enrichers/context.enricher';
import { defineConfig } from './utils/define-config.util';

/**
 * Logger DI module.
 *
 * Provides the `LoggerManager` singleton, built-in reporters (console, json, silent),
 * the enrichment pipeline (interpolation, context, redaction, sampling),
 * the ContextRepository, and the logger configuration.
 *
 * @example
 * ```typescript
 * import { LoggerModule } from '@stackra/logger';
 * import { ILogLevel } from '@stackra/contracts';
 *
 * @Module({
 *   imports: [
 *     LoggerModule.forRoot({
 *       default: 'app',
 *       channels: {
 *         app: { level: ILogLevel.DEBUG, reporters: ['console'], formatter: 'pretty' },
 *         audit: { level: ILogLevel.INFO, reporters: ['json'], formatter: 'json' },
 *       },
 *       redact: { paths: ['password', 'token'] },
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class LoggerModule {
  /**
   * Register the logger module globally with static configuration.
   *
   * @param config - Logger configuration (channels, default, redact). Uses sensible defaults if omitted.
   * @returns Dynamic module definition
   */
  public static forRoot(config: Partial<ILoggerModuleConfig> = {}): DynamicModule {
    const mergedConfig = defineConfig(config);

    return {
      module: LoggerModule,
      global: true,
      providers: [
        // Configuration token
        { provide: LOGGER_CONFIG, useValue: mergedConfig },

        // Context Repository
        ContextRepository,

        // Built-in reporters (auto-discovered via @Reporter decorator)
        ConsoleReporter,
        JsonReporter,
        SilentReporter,

        // LoggerManager — the main service
        {
          provide: LOGGER_MANAGER,
          useFactory: (mgr: LoggerManager) => mgr,
          inject: [LoggerManager],
        },
        {
          provide: LoggerManager,
          useFactory: (cfg: ILoggerModuleConfig, contextRepo: ContextRepository) => {
            const manager = new LoggerManager(cfg);

            // Enricher registration is explicit — order matters:
            // 1. Interpolation (must run first to resolve {placeholders})
            manager.prependEnricher(new InterpolationEnricher());

            // 2. Context enricher (adds request/global context to entries)
            manager.addEnricher(new ContextEnricher(contextRepo));

            // 3. Redaction enricher (must run AFTER context to redact all fields)
            if (cfg.redact && cfg.redact.paths.length > 0) {
              manager.addEnricher(new RedactionEnricher(cfg.redact));
            }

            // Set global context if configured
            if (cfg.globalContext) {
              manager.setGlobalContext(cfg.globalContext);
            }

            return manager;
          },
          inject: [LOGGER_CONFIG, ContextRepository],
        },

        // Reporter auto-discovery loader — registers all @Reporter providers on init
        ReporterLoader,

        // Shutdown service — flushes reporters on container teardown
        LoggerShutdownService,
      ],
      exports: [LOGGER_MANAGER, LoggerManager, LOGGER_CONFIG, ContextRepository],
    };
  }

  /**
   * Register the logger module globally with async configuration.
   *
   * Use when the logger config depends on other DI-resolved services
   * (e.g., reading from a config service or async env resolver).
   *
   * @param options - Async module options with useFactory and inject
   * @returns Dynamic module definition
   *
   * @example
   * ```typescript
   * LoggerModule.forRootAsync({
   *   useFactory: (configService: ConfigService) => ({
   *     default: 'app',
   *     channels: {
   *       app: { level: configService.get('LOG_LEVEL'), reporters: ['console'] },
   *     },
   *   }),
   *   inject: [ConfigService],
   * });
   * ```
   */
  public static forRootAsync(options: ILoggerModuleAsyncOptions): DynamicModule {
    return {
      module: LoggerModule,
      global: true,
      providers: [
        // Async config provider
        {
          provide: LOGGER_CONFIG,
          useFactory: async (...args: unknown[]) => {
            const raw = await options.useFactory(...args);
            return defineConfig(raw);
          },
          inject: options.inject ?? [],
        },

        // Context Repository
        ContextRepository,

        // Built-in reporters (auto-discovered via @Reporter decorator)
        ConsoleReporter,
        JsonReporter,
        SilentReporter,

        // LoggerManager alias
        {
          provide: LOGGER_MANAGER,
          useFactory: (mgr: LoggerManager) => mgr,
          inject: [LoggerManager],
        },
        {
          provide: LoggerManager,
          useFactory: (cfg: ILoggerModuleConfig, contextRepo: ContextRepository) => {
            const manager = new LoggerManager(cfg);

            // Enricher registration is explicit — order matters:
            // 1. Interpolation first
            manager.prependEnricher(new InterpolationEnricher());

            // 2. Context enricher
            manager.addEnricher(new ContextEnricher(contextRepo));

            // 3. Redaction enricher
            if (cfg.redact && cfg.redact.paths.length > 0) {
              manager.addEnricher(new RedactionEnricher(cfg.redact));
            }

            if (cfg.globalContext) {
              manager.setGlobalContext(cfg.globalContext);
            }

            return manager;
          },
          inject: [LOGGER_CONFIG, ContextRepository],
        },

        // Reporter auto-discovery loader — registers all @Reporter providers on init
        ReporterLoader,

        // Shutdown service — flushes reporters on container teardown
        LoggerShutdownService,
      ],
      exports: [LOGGER_MANAGER, LoggerManager, LOGGER_CONFIG, ContextRepository],
    };
  }
}
