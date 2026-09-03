/**
 * @file validation-exception.filter.ts
 * @module @stackra/nestjs-response/http/filters
 * @description Exception filter for validation errors (BadRequestException).
 *   Catches validation failures and returns a 422 Unprocessable Entity response
 *   with field-level error details.
 */

import {
  Catch,
  ExceptionFilter,
  ArgumentsHost,
  BadRequestException,
  Inject,
  Optional,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import type { IResponseEnvelope } from '../../interfaces/response-envelope.interface';
import type { IErrorDetail } from '../../interfaces/error-detail.interface';
import type { IResponseModuleConfig } from '../../interfaces/response-config.interface';
import { RESPONSE_CONFIG } from '../../constants';
import { ResponseContext } from '../../context/response-context.service';

/**
 * Exception filter that catches BadRequestException with validation errors.
 *
 * Transforms NestJS validation pipe errors into a 422 Unprocessable Entity
 * response with field-level error details in the standard envelope format.
 */
@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  /**
   * @param config - Module configuration
   * @param context - Request-scoped context for request ID
   */
  public constructor(
    @Inject(RESPONSE_CONFIG) private readonly config: IResponseModuleConfig,
    @Optional() private readonly context?: ResponseContext
  ) {}

  /**
   * Handle a BadRequestException and return a 422 validation error envelope.
   *
   * @param exception - The caught BadRequestException
   * @param host - The arguments host for accessing the response
   */
  public catch(exception: BadRequestException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const exceptionResponse = exception.getResponse();

    const errors: IErrorDetail[] = this.extractValidationErrors(exceptionResponse);

    const envelope: IResponseEnvelope<null> = {
      success: false,
      message: 'Validation failed',
      data: null,
      errors,
      timestamp: new Date().toISOString(),
    };

    if (this.context) {
      envelope.request_id = this.context.requestId;
    }

    // Add debug information in debug mode
    if (this.config.debug?.enabled && this.context) {
      envelope.debug = { elapsed_ms: this.context.getElapsedMs() };
    }

    response.status(HttpStatus.UNPROCESSABLE_ENTITY).json(envelope);
  }

  /**
   * Extract validation errors from the exception response.
   *
   * @param exceptionResponse - The raw exception response object
   * @returns Array of structured error details
   */
  private extractValidationErrors(exceptionResponse: string | object): IErrorDetail[] {
    if (typeof exceptionResponse === 'string') {
      return [{ code: 'VALIDATION_FAILED', message: exceptionResponse }];
    }

    const responseObj = exceptionResponse as Record<string, unknown>;
    const messages = responseObj['message'];

    if (Array.isArray(messages)) {
      return messages.map((msg) => {
        if (typeof msg === 'string') {
          return { code: 'VALIDATION_FAILED', message: msg };
        }
        if (typeof msg === 'object' && msg !== null) {
          const errorObj = msg as Record<string, unknown>;
          return {
            code: 'VALIDATION_FAILED',
            message: (errorObj['message'] as string) ?? String(msg),
            field: errorObj['property'] as string | undefined,
          };
        }
        return { code: 'VALIDATION_FAILED', message: String(msg) };
      });
    }

    return [{ code: 'VALIDATION_FAILED', message: (messages as string) ?? 'Validation failed' }];
  }
}
