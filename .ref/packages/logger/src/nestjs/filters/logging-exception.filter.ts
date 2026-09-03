/**
 * @file logging-exception.filter.ts
 * @module @stackra/logger/nestjs/filters
 * @description Global exception filter that logs all unhandled exceptions.
 *   Logs at ERROR level for 4xx responses and FATAL level for 5xx responses,
 *   then re-throws to allow NestJS default error handling to produce the response.
 */

import { Catch, type ExceptionFilter, type ArgumentsHost, HttpException } from '@nestjs/common';

import { Logger } from '../../core/services/logger.service';

/**
 * Logging exception filter — catches all exceptions and logs them.
 *
 * Registered globally via `APP_FILTER` in the NestJS logger module.
 * Logs the exception at the appropriate level (ERROR for 4xx, FATAL for 5xx),
 * then re-throws so NestJS can produce the error response.
 *
 * This filter does NOT alter the response — it only ensures every exception
 * is recorded in the logging system with full context.
 *
 * @example
 * ```typescript
 * // Automatically registered by NestLoggerModule.forRoot()
 * // Or manually:
 * { provide: APP_FILTER, useClass: LoggingExceptionFilter }
 * ```
 */
@Catch()
export class LoggingExceptionFilter implements ExceptionFilter {
  /** Logger instance for exception reporting. */
  private readonly logger = new Logger(LoggingExceptionFilter.name);

  /**
   * Catch and log all exceptions, then re-throw.
   *
   * @param exception - The caught exception
   * @param host - NestJS arguments host for request context
   */
  public catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();

    const status = this.getStatus(exception);
    const message = this.getMessage(exception);
    const method = request?.method ?? 'UNKNOWN';
    const url = request?.url ?? 'UNKNOWN';

    const meta = {
      statusCode: status,
      method,
      url,
      exceptionName: exception instanceof Error ? exception.constructor.name : 'UnknownException',
    };

    if (status >= 500) {
      this.logger.fatal(
        `Unhandled exception: ${message}`,
        exception instanceof Error ? exception : undefined,
        meta
      );
    } else {
      this.logger.error(
        `HTTP exception: ${message}`,
        exception instanceof Error ? exception : undefined,
        meta
      );
    }

    // Re-throw to let NestJS handle the response
    throw exception;
  }

  /**
   * Extract the HTTP status code from an exception.
   *
   * @param exception - The caught exception
   * @returns HTTP status code (defaults to 500)
   */
  private getStatus(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }
    return 500;
  }

  /**
   * Extract a human-readable message from an exception.
   *
   * @param exception - The caught exception
   * @returns Error message string
   */
  private getMessage(exception: unknown): string {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'string') return response;
      if (typeof response === 'object' && response !== null && 'message' in response) {
        const msg = (response as any).message;
        return Array.isArray(msg) ? msg.join(', ') : String(msg);
      }
      return exception.message;
    }
    if (exception instanceof Error) {
      return exception.message;
    }
    return 'Internal server error';
  }
}
