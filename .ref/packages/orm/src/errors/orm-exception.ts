/**
 * @file orm-exception.ts
 * @module @stackra/nestjs-orm/errors
 * @description Abstract base class for all ORM-specific exceptions.
 *   Extends NestJS HttpException to ensure proper HTTP status code mapping
 *   when exceptions propagate to the NestJS exception filter layer.
 */

import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Abstract base class for all ORM exceptions.
 *
 * Every typed ORM exception extends this class, providing:
 * - A unique `code` string for programmatic identification
 * - A structured `details` payload for machine-readable error data
 * - Proper HTTP status code mapping via NestJS HttpException
 *
 * @example
 * ```typescript
 * try {
 *   await em.flush();
 * } catch (error) {
 *   if (error instanceof OrmException) {
 *     console.log(error.code);    // 'ORM_UNIQUE_CONSTRAINT'
 *     console.log(error.details); // { constraintName: '...', fields: {...} }
 *   }
 * }
 * ```
 */
export abstract class OrmException extends HttpException {
  /** Unique error code for programmatic identification. */
  public abstract readonly code: string;

  /** Structured details payload for machine-readable error data. */
  public readonly details: Record<string, unknown>;

  /**
   * @param message - Human-readable error message
   * @param status - HTTP status code to return
   * @param details - Structured details for the error response
   */
  protected constructor(
    message: string,
    status: HttpStatus,
    details: Record<string, unknown> = {}
  ) {
    super(
      {
        message,
        error: 'OrmException',
        ...details,
      },
      status
    );
    this.details = details;
  }
}
