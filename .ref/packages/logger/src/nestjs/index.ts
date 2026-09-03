/**
 * @file index.ts
 * @module @stackra/logger/nestjs
 * @description NestJS adapter for the @stackra/logger system.
 *   Provides pino integration, NestJS logger bridge, request logging,
 *   file/syslog reporters, exception filter, health indicator,
 *   and production-grade structured logging for NestJS backends.
 */

// ============================================================================
// Module
// ============================================================================
export { NestLoggerModule, type INestLoggerModuleOptions } from './nest-logger.module';

// ============================================================================
// Services
// ============================================================================
export { NestLoggerServiceAdapter } from './services/nest-logger.service';
export { AsyncContextRepository } from './services/async-context-repository.service';
export { NestDiscoveryAdapter } from './services/nest-discovery.adapter';

// ============================================================================
// Reporters
// ============================================================================
export { PinoReporter } from './reporters/pino.reporter';
export { FileReporter, type IFileReporterConfig } from './reporters/file.reporter';
export { SyslogReporter, type ISyslogReporterConfig } from './reporters/syslog.reporter';

// ============================================================================
// Middleware
// ============================================================================
export {
  RequestContextMiddleware,
  getRequestContext,
  type IRequestContext,
} from './middleware/request-context.middleware';

// ============================================================================
// Interceptors
// ============================================================================
export { RequestLoggingInterceptor } from './interceptors/request-logging.interceptor';

// ============================================================================
// Filters
// ============================================================================
export { LoggingExceptionFilter } from './filters/logging-exception.filter';

// ============================================================================
// Health
// ============================================================================
export { LoggerHealthIndicator, type ILoggerHealthResult } from './health/logger-health.indicator';

// ============================================================================
// Re-export core (consumers only need to install one subpath)
// ============================================================================
export {
  LoggerModule,
  type ILoggerModuleAsyncOptions,
  LoggerManager,
  Logger,
  EmergencyLogger,
  ContextRepository,
  LoggerShutdownService,
  ReporterLoader,
  ConsoleReporter,
  JsonReporter,
  SilentReporter,
  RedactionEnricher,
  type IRedactionConfig,
  SamplingEnricher,
  type SamplingConfig,
  InterpolationEnricher,
  ContextEnricher,
  JsonFormatter,
  PrettyFormatter,
  Reporter,
  REPORTER_METADATA_KEY,
  defineConfig,
} from '../core';
export type { ILogChannel, IChannelTap } from '../core';
