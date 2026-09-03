/**
 * @file request-logging.interceptor.ts
 * @module @stackra/logger/nestjs/interceptors
 * @description NestJS interceptor that auto-logs incoming HTTP requests and responses.
 *   Records method, URL, status code, and duration at INFO level.
 */

import {
  Injectable,
  type NestInterceptor,
  type ExecutionContext,
  type CallHandler,
} from '@nestjs/common';
import { type Observable, tap } from 'rxjs';

import { LoggerManager } from '../../core/services/logger-manager.service';
import { getRequestContext } from '../middleware/request-context.middleware';

/**
 * NestJS interceptor that logs every HTTP request/response cycle.
 *
 * Logs at INFO level:
 * - Incoming: HTTP method, URL, user-agent
 * - Outgoing: status code, duration in milliseconds
 *
 * Automatically includes requestId and traceId from the request context
 * middleware (if active).
 *
 * @example
 * ```typescript
 * // Applied automatically by NestLoggerModule when requestLogging is enabled
 * app.useGlobalInterceptors(new RequestLoggingInterceptor(loggerManager));
 * ```
 */
@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  /**
   * @param manager - LoggerManager instance for creating the request logger
   */
  public constructor(private readonly manager: LoggerManager) {}

  /**
   * Intercept the request/response cycle and log both phases.
   *
   * @param context - NestJS execution context
   * @param next - Call handler for downstream processing
   * @returns Observable of the response
   */
  public intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest();

    const method = request.method ?? 'UNKNOWN';
    const url = request.url ?? request.originalUrl ?? '/';
    const userAgent = request.headers?.['user-agent'] ?? '';

    const logger = this.manager.create('HTTP');
    const reqCtx = getRequestContext();
    const startTime = reqCtx?.startTime ?? performance.now();

    logger.info(`→ ${method} ${url}`, {
      method,
      url,
      userAgent,
      requestId: reqCtx?.requestId,
      traceId: reqCtx?.traceId,
    });

    return next.handle().pipe(
      tap({
        next: () => {
          const response = httpContext.getResponse();
          const statusCode = response.statusCode ?? 200;
          const durationMs = Math.round(performance.now() - startTime);

          logger.info(`← ${method} ${url} ${statusCode} ${durationMs}ms`, {
            method,
            url,
            statusCode,
            durationMs,
            requestId: reqCtx?.requestId,
          });
        },
        error: (error: Error) => {
          const durationMs = Math.round(performance.now() - startTime);

          logger.error(`✗ ${method} ${url} failed after ${durationMs}ms`, error, {
            method,
            url,
            durationMs,
            requestId: reqCtx?.requestId,
          });
        },
      })
    );
  }
}
