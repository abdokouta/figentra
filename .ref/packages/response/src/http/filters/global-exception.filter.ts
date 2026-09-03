/**
 * @file global-exception.filter.ts
 * @module @stackra/nestjs-response/http/filters
 * @description Global exception filter that catches all unhandled exceptions
 *   and formats them into the standard error envelope. Includes stack traces
 *   in debug mode for development environments.
 */

import {
  Catch,
  ExceptionFilter,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import type { Response } from 'express';
import type { IResponseEnvelope } from '../../interfaces/response-envelope.interface';
import type { IResponseModuleConfig } from '../../interfaces/response-config.interface';
import { RESPONSE_CONFIG } from '../../constants';
import { ErrorFormatterService } from '../../errors/error-formatter.service';
import { randomUUID } from 'crypto';

/**
 * Global exception filter that catches all exceptions and returns
 * a standard error envelope response.
 *
 * Features:
 * - Catches all exception types (HttpException and generic Error)
 * - Formats errors via ErrorFormatterService for consistent output
 * - Returns standard error envelope with appropriate status code
 * - Includes stack trace in debug mode for development
 * - Adds request_id from ResponseContext for tracing
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  /**
   * @param config - Module configuration for debug settings
   * @param errorFormatter - Service for formatting errors
   * @param context - Request-scoped context for request ID
   */
  public constructor(
    @Inject(RESPONSE_CONFIG) private readonly config: IResponseModuleConfig,
    private readonly errorFormatter: ErrorFormatterService
  ) {}

  /**
   * Handle a caught exception and return a standard error envelope.
   *
   * @param exception - The caught exception
   * @param host - The arguments host for accessing the response
   */
  public catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status: number;
    let message: string;
    let errors: Array<{
      code: string;
      message: string;
      field?: string;
      meta?: Record<string, unknown>;
    }>;

    if (exception instanceof HttpException) {
      if (this.errorFormatter) {
        const formatted = this.errorFormatter.formatHttpException(exception);
        status = formatted.status;
        message = formatted.message;
        errors = formatted.errors;
      } else {
        status = exception.getStatus();
        message = exception.message;
        errors = [{ code: 'HTTP_ERROR', message }];
      }
    } else if (exception instanceof Error) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = exception.message || 'Internal server error';
      errors = this.errorFormatter
        ? this.errorFormatter.formatException(exception)
        : [{ code: 'INTERNAL_ERROR', message }];
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'An unexpected error occurred';
      errors = [{ code: 'INTERNAL_ERROR', message }];
    }

    const envelope: IResponseEnvelope<null> = {
      success: false,
      message,
      data: null,
      errors,
      timestamp: new Date().toISOString(),
    };

    // Add request ID if available
    if (this.config.envelope?.includeRequestId) {
      envelope.request_id = randomUUID();
    }

    // Add debug information in debug mode
    if (this.config.debug?.enabled && exception instanceof Error) {
      envelope.debug = {
        elapsed_ms: 0,
      };

      if (this.config.debug.includeStack) {
        envelope.debug['stack'] = exception.stack;
      }
    }

    response.status(status).json(envelope);
  }
}
