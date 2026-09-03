/**
 * @file error-envelope.ts
 * @module @stackra/nestjs-response/core/envelope
 * @description Builder class for constructing error response envelopes.
 *   Provides factory methods for common error scenarios: exceptions,
 *   validation failures, and domain errors.
 */

import type { IResponseEnvelope } from '../interfaces/response-envelope.interface';
import type { IErrorDetail } from '../interfaces/error-detail.interface';

/**
 * Builds error response envelopes from various error sources.
 *
 * Provides static factory methods for the three most common error patterns:
 * - Exception-based errors (caught exceptions)
 * - Validation errors (field-level failures)
 * - Domain errors (business logic violations)
 */
export class ErrorEnvelope {
  /**
   * Create an error envelope from a caught exception.
   *
   * @param error - The caught error instance
   * @returns A complete error response envelope
   */
  public static fromException(error: Error): IResponseEnvelope<null> {
    const errors: IErrorDetail[] = [
      {
        code: 'INTERNAL_ERROR',
        message: error.message || 'An unexpected error occurred',
      },
    ];

    return {
      success: false,
      data: null,
      errors,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Create an error envelope from validation errors.
   *
   * @param errors - Array of structured validation error details
   * @returns A complete validation error response envelope
   */
  public static fromValidation(errors: IErrorDetail[]): IResponseEnvelope<null> {
    return {
      success: false,
      message: 'Validation failed',
      data: null,
      errors,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Create an error envelope from a domain-level error.
   *
   * @param code - Machine-readable error code
   * @param message - Human-readable error description
   * @returns A complete domain error response envelope
   */
  public static fromDomain(code: string, message: string): IResponseEnvelope<null> {
    const errors: IErrorDetail[] = [{ code, message }];

    return {
      success: false,
      message,
      data: null,
      errors,
      timestamp: new Date().toISOString(),
    };
  }
}
