/**
 * @file nest-logger.module.ts
 * @module @stackra/logger/nestjs
 * @description NestJS-specific logger module.
 *   Imports the core LoggerModule and adds NestJS-specific features on top:
 *   - PinoReporter for production-grade structured logging
 *   - NestLoggerServiceAdapter for NestJS internal log bridging
 *   - AsyncContextRepository for per-request isolation via AsyncLocalStorage
 *   - Request logging interceptor with W3C Trace Context propagation
 *   - Global exception filter for automatic error/fatal logging
 *   - Logger health indicator
 *
 *   Discovery is handled by NestContainerModule (provides DISCOVERY_SERVICE).
 *   The NestJS module ALWAYS imports the core module — it never re-implements
 *   core logic (per platform-package-standard).
 *
 *   Note: Requires `NestContainerModule.forRoot()` to be imported in the app's
 *   root module for DISCOVERY_SERVICE to be available. The ReporterLoader in the
 *   core module will use NestDiscoveryService automatically.
 */

import {
  Module,
  type DynamicModule,
  type MiddlewareConsumer,
  type NestModule,
} from '@nestjs/common';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { LOGGER_MANAGER, type ILoggerModuleConfig, ILogLevel } from '@stackra/contracts';

import { LoggerModule } from '../core/logger.module';
import { LoggerManager } from '../core/services/logger-manager.service';
import { ContextRepository } from '../core/services/context-repository.service';
import { PinoReporter } from './reporters/pino.reporter';
import { AsyncContextRepository } from './services/async-context-repository.service';
import { NestLoggerServiceAdapter } from './services/nest-logger.service';
import { RequestContextMiddleware } from './middleware/request-context.middleware';
import { RequestLoggingInterceptor } from './interceptors/request-logging.interceptor';
import { LoggingExceptionFilter } from './filters/logging-exception.filter';
import { LoggerHealthIndicator } from './health/logger-health.indicator';

/**
 * Default NestJS logger configuration.
 * Uses pino in production, console in development.
 */
export const DEFAULT_NEST_CONFIG: Partial<ILoggerModuleConfig> = {
  default: 'app',
  channels: {
    app: {
      level: ILogLevel.INFO,
      reporters: ['pino'],
      formatter: 'json',
    },
  },
};

/**
 * NestJS Logger Module.
 *
 * Production-grade logging for NestJS backends. Imports the core LoggerModule
 * (which provides LoggerManager, reporters, enrichers, shutdown service) and
 * adds NestJS-specific features on top:
 *
 * - PinoReporter (high-performance structured JSON with pino-pretty auto-detection)
 * - AsyncContextRepository (per-request context isolation via AsyncLocalStorage)
 * - NestLoggerServiceAdapter (bridges NestJS internal logs)
 * - RequestContextMiddleware (W3C Trace Context + correlation ID propagation)
 * - RequestLoggingInterceptor (auto-logs HTTP method, URL, status, duration)
 * - LoggingExceptionFilter (logs all unhandled exceptions at ERROR/FATAL)
 * - LoggerHealthIndicator (reporter status and health check)
 *
 * @example
 * ```typescript
 * import { NestLoggerModule } from '@stackra/logger/nestjs';
 *
 * @Module({
 *   imports: [
 *     NestLoggerModule.forRoot({
 *       default: 'app',
 *       channels: {
 *         app: { level: 'info', reporters: ['pino'] },
 *         audit: { level: 'info', reporters: ['json'] },
 *       },
 *       requestLogging: true,
 *       replaceNestLogger: true,
 *     }),
 *   ],
 * })
 * export class AppModule {}
 *
 * // In main.ts:
 * const app = await NestFactory.create(AppModule, { bufferLogs: true });
 * app.useLogger(app.get(NestLoggerServiceAdapter));
 * ```
 */
@Module({})
export class NestLoggerModule implements NestModule {
  /** Stored options for middleware configuration. */
  private static moduleOptions: INestLoggerModuleOptions = {};

  /**
   * Configure middleware for request context propagation.
   *
   * @param consumer - NestJS middleware consumer
   */
  public configure(consumer: MiddlewareConsumer): void {
    const { requestLogging = true } = NestLoggerModule.moduleOptions;

    if (requestLogging) {
      consumer.apply(RequestContextMiddleware).forRoutes('*');
    }
  }

  /**
   * Register the NestJS logger module globally.
   *
   * Imports the core LoggerModule.forRoot() with merged configuration,
   * then layers NestJS-specific providers (PinoReporter, AsyncContextRepository,
   * interceptor, filter, health indicator) on top.
   *
   * @param options - Logger configuration with optional NestJS-specific settings
   * @returns Dynamic module definition
   */
  public static forRoot(options: INestLoggerModuleOptions = {}): DynamicModule {
    const {
      replaceNestLogger: _replace = true,
      requestLogging = true,
      exceptionFilter = true,
      ...configOverrides
    } = options;

    // Store options for middleware configuration
    NestLoggerModule.moduleOptions = options;

    // Merge NestJS defaults with user config
    const mergedConfig: Partial<ILoggerModuleConfig> = {
      ...DEFAULT_NEST_CONFIG,
      ...configOverrides,
      channels: {
        ...DEFAULT_NEST_CONFIG.channels,
        ...(configOverrides.channels ?? {}),
      },
    };

    const providers: Array<any> = [
      // NestJS-specific: PinoReporter (auto-discovered via @Reporter decorator)
      PinoReporter,

      // NestJS-specific: AsyncContextRepository overrides core ContextRepository
      AsyncContextRepository,
      { provide: ContextRepository, useExisting: AsyncContextRepository },

      // NestJS-specific: Request context middleware
      RequestContextMiddleware,

      // NestJS-specific: NestJS logger bridge
      {
        provide: NestLoggerServiceAdapter,
        useFactory: (manager: LoggerManager) => new NestLoggerServiceAdapter(manager),
        inject: [LoggerManager],
      },

      // NestJS-specific: Health indicator
      LoggerHealthIndicator,
    ];

    // Register request logging interceptor globally if enabled
    if (requestLogging) {
      providers.push({
        provide: APP_INTERCEPTOR,
        useFactory: (manager: LoggerManager) => new RequestLoggingInterceptor(manager),
        inject: [LoggerManager],
      });
    }

    // Register global exception filter if enabled
    if (exceptionFilter) {
      providers.push({
        provide: APP_FILTER,
        useClass: LoggingExceptionFilter,
      });
    }

    return {
      module: NestLoggerModule,
      global: true,
      imports: [
        // Core module handles: LoggerManager, config, reporters (console, json, silent),
        // enrichers (interpolation, context, redaction, sampling), shutdown service,
        // ReporterLoader (auto-discovery orchestrator)
        LoggerModule.forRoot(mergedConfig),
      ],
      providers,
      exports: [
        NestLoggerServiceAdapter,
        PinoReporter,
        ContextRepository,
        AsyncContextRepository,
        LoggerHealthIndicator,
      ],
    };
  }
}
