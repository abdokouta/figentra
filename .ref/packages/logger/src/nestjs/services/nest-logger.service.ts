/**
 * @file nest-logger.service.ts
 * @module @stackra/logger/nestjs/services
 * @description NestJS LoggerService implementation that bridges NestJS internal
 *   logging into our LoggerManager. When set as the app logger, NestJS
 *   bootstrap messages, request logs, and error logs all flow through
 *   our channel/reporter system.
 */

import {
  Injectable,
  type LoggerService as NestLoggerService,
  type ILogLevel as NestLogLevel,
} from '@nestjs/common';
import { LoggerManager } from '../../core/services/logger-manager.service';
import { type ILogger } from '@stackra/contracts';

/**
 * NestJS LoggerService implementation backed by our LoggerManager.
 *
 * Pass this to `app.useLogger()` during NestJS bootstrap to route ALL
 * NestJS internal logs (routing, lifecycle, errors) through our system.
 *
 * @example
 * ```typescript
 * import { NestFactory } from '@nestjs/core';
 * import { NestLoggerService } from '@stackra/logger/nestjs';
 *
 * const app = await NestFactory.create(AppModule, { bufferLogs: true });
 * app.useLogger(app.get(NestLoggerService));
 * ```
 */
@Injectable()
export class NestLoggerServiceAdapter implements NestLoggerService {
  /** Internal logger bound to 'NestJS' context. */
  private readonly logger: ILogger;

  /**
   * @param manager - The LoggerManager singleton
   */
  public constructor(manager: LoggerManager) {
    this.logger = manager.create('NestJS');
  }

  /**
   * Log a message at 'log' level (maps to INFO).
   *
   * @param message - Log message
   * @param optionalParams - Additional context
   */
  public log(message: unknown, ...optionalParams: unknown[]): void {
    const { msg, context } = this.extractContext(message, optionalParams);
    if (context) {
      this.logger.info(`[${context}] ${msg}`);
    } else {
      this.logger.info(msg);
    }
  }

  /**
   * Log a message at ERROR level.
   *
   * @param message - Error message
   * @param optionalParams - Additional context (may include stack trace)
   */
  public error(message: unknown, ...optionalParams: unknown[]): void {
    const { msg, context, stack } = this.extractContext(message, optionalParams);
    const errorMsg = context ? `[${context}] ${msg}` : msg;

    if (stack) {
      this.logger.error(errorMsg, new Error(String(stack)));
    } else {
      this.logger.error(errorMsg);
    }
  }

  /**
   * Log a message at WARN level.
   *
   * @param message - Warning message
   * @param optionalParams - Additional context
   */
  public warn(message: unknown, ...optionalParams: unknown[]): void {
    const { msg, context } = this.extractContext(message, optionalParams);
    if (context) {
      this.logger.warn(`[${context}] ${msg}`);
    } else {
      this.logger.warn(msg);
    }
  }

  /**
   * Log a message at DEBUG level.
   *
   * @param message - Debug message
   * @param optionalParams - Additional context
   */
  public debug(message: unknown, ...optionalParams: unknown[]): void {
    const { msg, context } = this.extractContext(message, optionalParams);
    if (context) {
      this.logger.debug(`[${context}] ${msg}`);
    } else {
      this.logger.debug(msg);
    }
  }

  /**
   * Log a message at VERBOSE level (maps to DEBUG).
   *
   * @param message - Verbose message
   * @param optionalParams - Additional context
   */
  public verbose(message: unknown, ...optionalParams: unknown[]): void {
    this.debug(message, ...optionalParams);
  }

  /**
   * Log a message at FATAL level.
   *
   * @param message - Fatal message
   * @param optionalParams - Additional context
   */
  public fatal(message: unknown, ...optionalParams: unknown[]): void {
    const { msg, context } = this.extractContext(message, optionalParams);
    if (context) {
      this.logger.fatal(`[${context}] ${msg}`);
    } else {
      this.logger.fatal(msg);
    }
  }

  /**
   * Set log levels — no-op since our system uses channel-based level config.
   *
   * @param _levels - Ignored
   */
  public setLogLevels(_levels: NestLogLevel[]): void {
    // No-op — our level filtering is per-channel, not global
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Private Helpers
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Extract context name and stack trace from NestJS log arguments.
   * NestJS passes context as the last argument.
   *
   * @param message - The message (string or object)
   * @param params - Optional params (last may be context string)
   * @returns Parsed message, context, and stack
   */
  private extractContext(
    message: unknown,
    params: unknown[]
  ): { msg: string; context?: string; stack?: string } {
    const msg = typeof message === 'string' ? message : JSON.stringify(message);

    // NestJS convention: last param is context string
    const lastParam = params[params.length - 1];
    const context = typeof lastParam === 'string' ? lastParam : undefined;

    // Stack trace might be the second-to-last param for errors
    const stackParam = params.length > 1 ? params[params.length - 2] : undefined;
    const stack =
      typeof stackParam === 'string' && stackParam.includes('\n') ? stackParam : undefined;

    return { msg, context, stack };
  }
}
