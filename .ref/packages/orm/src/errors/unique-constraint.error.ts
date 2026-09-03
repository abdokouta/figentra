/**
 * @file unique-constraint.error.ts
 * @module @stackra/nestjs-orm/errors
 * @description Thrown when a PostgreSQL unique constraint violation occurs during flush.
 */

import { HttpStatus } from '@nestjs/common';

import { OrmException } from './orm-exception';

/**
 * Thrown when a database unique constraint is violated.
 *
 * Wraps PostgreSQL error code `23505` (unique_violation) with structured
 * metadata about which constraint was violated and the conflicting field values.
 *
 * @example
 * ```typescript
 * try {
 *   await userService.create({ email: 'existing@test.com' });
 * } catch (error) {
 *   if (error instanceof UniqueConstraintError) {
 *     console.log(error.constraintName); // 'users_email_unique'
 *     console.log(error.fields);         // { email: 'existing@test.com' }
 *   }
 * }
 * ```
 */
export class UniqueConstraintError extends OrmException {
  public readonly code = 'ORM_UNIQUE_CONSTRAINT';

  /**
   * @param constraintName - The database constraint name that was violated
   * @param fields - Map of field names to conflicting values
   */
  public constructor(
    public readonly constraintName: string,
    public readonly fields: Record<string, unknown>
  ) {
    super(`Unique constraint "${constraintName}" violated`, HttpStatus.CONFLICT, {
      constraintName,
      fields,
    });
  }
}
