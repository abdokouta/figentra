/**
 * @file error-formatter.service.ts
 * @module @stackra/nestjs-response/core/errors
 * @description Service for formatting various error types into structured error details.
 *   Handles exceptions, validation errors, and HTTP exceptions with consistent output.
 */

import { IInjectable, HttpException, HttpStatus } from '@nestjs/common';
import type { IErrorDetail } from '../interfaces/error-detail.interface';

/**
 * Formats errors from various sources into structured `IErrorDetail` arrays.
 *
 * Provides consistent error formatting for:
 * - Generic exceptions (Error instances)
 * - Validation errors (field-level failures from class-validator)
 * - NestJS HTTP exceptions (with status code extraction)
 */
@IInjectable()
export class ErrorFormatterService {
  /**
   * Format a generic exception into structured error details.
   *
   * @param error - The caught error instance
   * @returns Array of structured error details
   */
  public formatException(error: Error): IErrorDetail[] {
    return [
      {
        code: this.extractErrorCode(error),
        message: error.message || 'An unexpected error occurred',
      },
    ];
  }

  /**
   * Format validation errors into structured field-level error details.
   *
   * Handles both class-validator style objects and flat string arrays.
   *
   * @param errors - Array of validation error objects
   * @returns Array of structured error details with field associations
   */
  public formatValidation(
    errors: Array<{
      property?: string;
      field?: string;
      constraints?: Record<string, string>;
      message?: string;
    }>
  ): IErrorDetail[] {
    const details: IErrorDetail[] = [];

    for (const error of errors) {
      if (error.constraints) {
        const constraintMessages = Object.values(error.constraints);
        for (const message of constraintMessages) {
          details.push({
            code: 'VALIDATION_FAILED',
            message,
            field: error.property ?? error.field,
          });
        }
      } else if (error.message) {
        details.push({
          code: 'VALIDATION_FAILED',
          message: error.message,
          field: error.property ?? error.field,
        });
      }
    }

    return details;
  }

  /**
   * Format a NestJS HTTP exception into a structured error response.
   *
   * Extracts the status code, error details, and message from the exception.
   *
   * @param exception - The NestJS HTTP exception
   * @returns Object containing status code, error details, and message
   */
  public formatHttpException(exception: HttpException): {
    status: number;
    errors: IErrorDetail[];
    message: string;
  } {
    const status = exception.getStatus();
    const response = exception.getResponse();
    let message: string;
    let errors: IErrorDetail[];

    if (typeof response === 'string') {
      message = response;
      errors = [{ code: this.statusToCode(status), message }];
    } else if (typeof response === 'object' && response !== null) {
      const responseObj = response as Record<string, unknown>;
      message = (responseObj['message'] as string) ?? exception.message;

      if (Array.isArray(responseObj['message'])) {
        errors = (responseObj['message'] as string[]).map((msg) => ({
          code: 'VALIDATION_FAILED',
          message: msg,
        }));
      } else {
        errors = [{ code: this.statusToCode(status), message }];
      }
    } else {
      message = exception.message;
      errors = [{ code: this.statusToCode(status), message }];
    }

    return { status, errors, message };
  }

  // ==========================================================================
  // Private Helpers
  // ==========================================================================

  /**
   * Extract an error code from an error instance.
   *
   * @param error - The error to extract a code from
   * @returns A machine-readable error code string
   */
  private extractErrorCode(error: Error): string {
    if ('code' in error && typeof (error as Record<string, unknown>)['code'] === 'string') {
      return (error as Record<string, unknown>)['code'] as string;
    }
    return 'INTERNAL_ERROR';
  }

  /**
   * Convert an HTTP status code to a machine-readable error code.
   *
   * @param status - HTTP status code
   * @returns Machine-readable error code string
   */
  private statusToCode(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'VALIDATION_FAILED';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'TOO_MANY_REQUESTS';
      case HttpStatus.INTERNAL_SERVER_ERROR:
        return 'INTERNAL_ERROR';
      default:
        return 'ERROR';
    }
  }
}
