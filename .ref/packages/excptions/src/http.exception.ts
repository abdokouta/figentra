import { HttpException as BaseHttpException, HttpExceptionOptions } from '@nestjs/common';

/**
 * HttpException Class
 *
 * Custom HTTP exception that extends BaseException and provides HTTP status code support.
 * This exception is used throughout the Nesvel monorepo for HTTP-related errors
 * in NestJS applications, replacing the default NestJS HttpException with a version
 * that supports the `make()` factory method pattern.
 *
 * **Purpose:**
 * Provides a consistent way to throw HTTP exceptions with status codes across
 * all NestJS applications in the monorepo, while maintaining compatibility with
 * NestJS exception filters and the BaseException factory pattern.
 *
 * **Key Features:**
 * - Extends BaseException with inherited `make()` factory method
 * - HTTP status code support for proper REST API error responses
 * - Compatible with NestJS exception filters
 * - Type-safe and follows monorepo exception patterns
 * - Can include additional response data/metadata
 *
 * @extends BaseException
 *
 * @example
 * ```typescript
 * import { HttpException, HttpStatus } from '@nesvel/shared';
 *
 * // Simple usage with status code
 * throw HttpException.make('User not found', HttpStatus.NOT_FOUND);
 *
 * // With additional response data
 * throw HttpException.make(
 *   'Validation failed',
 *   HttpStatus.BAD_REQUEST,
 *   { fields: ['email', 'password'] }
 * );
 *
 * // In a NestJS controller
 * @Get(':id')
 * async findOne(@Param('id') id: string) {
 *   const user = await this.userService.findOne(id);
 *   if (!user) {
 *     throw HttpException.make('User not found', HttpStatus.NOT_FOUND);
 *   }
 *   return user;
 * }
 *
 * // In middleware
 * if (!request.headers.authorization) {
 *   throw HttpException.make(
 *     'Authorization header required',
 *     HttpStatus.UNAUTHORIZED
 *   );
 * }
 *
 * // With metadata
 * throw HttpException.make(
 *   'Rate limit exceeded',
 *   HttpStatus.TOO_MANY_REQUESTS,
 *   {
 *     retryAfter: 60,
 *     limit: 100,
 *     remaining: 0
 *   }
 * );
 * ```
 *
 * @author Nesvel Team
 * @since 1.0.0
 */
export class HttpException extends BaseHttpException {
  /**
   * Factory method to create an I18nValidationException instance
   *
   * Provides a static factory method for creating exception instances,
   * following the factory pattern used throughout the Nesvel framework.
   *
   * @param errors - Array of validation errors from class-validator
   * @returns A new instance of I18nValidationException
   *
   * @example
   * ```typescript
   * const errors = await validate(dto);
   * if (errors.length > 0) {
   *   throw I18nValidationException.make(errors);
   * }
   * ```
   */
  static make(
    response: string | Record<string, any>,
    status: number,
    options?: HttpExceptionOptions | undefined
  ): HttpException {
    return HttpException.make(response, status, options);
  }
}
