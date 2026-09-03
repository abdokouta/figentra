/**
 * @file database-connection.error.ts
 * @module @stackra/nestjs-orm/errors
 * @description Thrown when a database connection failure occurs.
 */

import { HttpStatus } from '@nestjs/common';

import { OrmException } from './orm-exception';

/**
 * Thrown when the database connection fails or times out.
 *
 * Wraps connection errors (refused, timeout, DNS failure) with structured
 * metadata about which connection failed and the underlying cause.
 *
 * @example
 * ```typescript
 * try {
 *   await em.flush();
 * } catch (error) {
 *   if (error instanceof DatabaseConnectionError) {
 *     console.log(error.connectionName); // 'default'
 *     console.log(error.cause);          // 'ECONNREFUSED 127.0.0.1:5432'
 *   }
 * }
 * ```
 */
export class DatabaseConnectionError extends OrmException {
  public readonly code = 'ORM_CONNECTION_FAILED';

  /**
   * @param connectionName - The name of the connection that failed
   * @param cause - The underlying error message
   */
  public constructor(
    public readonly connectionName: string,
    public readonly cause: string
  ) {
    super(
      `Database connection "${connectionName}" failed: ${cause}`,
      HttpStatus.SERVICE_UNAVAILABLE,
      { connectionName, cause }
    );
  }
}
