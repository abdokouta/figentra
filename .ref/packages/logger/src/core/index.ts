/**
 * @file index.ts
 * @module @stackra/logger/core
 * @description Public API for the core logger package.
 *   Re-exports all public symbols needed for logging.
 */

// ============================================================================
// Module
// ============================================================================
export { LoggerModule, type ILoggerModuleAsyncOptions } from './logger.module';

// ============================================================================
// Services
// ============================================================================
export { LoggerManager } from './services/logger-manager.service';
export { Logger } from './services/logger.service';
export { EmergencyLogger } from './services/emergency-logger.service';
export { ContextRepository } from './services/context-repository.service';
export { LoggerShutdownService } from './services/logger-shutdown.service';
export { ReporterLoader } from './services/reporter-loader.service';

// ============================================================================
// Reporters
// ============================================================================
export { ConsoleReporter } from './reporters/console.reporter';
export { JsonReporter } from './reporters/json.reporter';
export { SilentReporter } from './reporters/silent.reporter';
export {
  BufferedReporterWrapper,
  type IBufferedReporterOptions,
} from './reporters/buffered-reporter.wrapper';

// ============================================================================
// Enrichers
// ============================================================================
export { RedactionEnricher, type IRedactionConfig } from './enrichers';
export { SamplingEnricher, type SamplingConfig } from './enrichers';
export { InterpolationEnricher } from './enrichers';
export { ContextEnricher } from './enrichers';

// ============================================================================
// Formatters
// ============================================================================
export { JsonFormatter } from './formatters';
export { PrettyFormatter } from './formatters';

// ============================================================================
// Decorators
// ============================================================================
export { Reporter, REPORTER_METADATA_KEY } from './decorators';

// ============================================================================
// Utilities
// ============================================================================
export { defineConfig } from './utils';

// ============================================================================
// Interfaces (internal — ILogChannel, IChannelTap)
// ============================================================================
export type { ILogChannel } from './interfaces/log-channel.interface';
export type { IChannelTap } from './interfaces/channel-tap.interface';

// ============================================================================
// Re-export contracts (convenience — consumers don't need to import both)
// ============================================================================
export {
  LOGGER_MANAGER,
  LOGGER_CONFIG,
  LOGGER_EVENTS,
  LogLevel,
  LOG_LEVEL_PRIORITY,
} from '@stackra/contracts';

export type {
  ILogger,
  ILoggerManager,
  ILogReporter,
  ILogEnricher,
  ILogFormatter,
  ILogEntry,
  ILogChannelConfig,
  ILoggerModuleConfig,
  IChannelTapConfig,
  LogContext,
} from '@stackra/contracts';
