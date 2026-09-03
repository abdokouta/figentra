/**
 * @file reference-constraint.error.ts
 * @module @stackra/nestjs-orm/errors
 * @description Thrown when a PostgreSQL foreign key constraint violation occurs during flush.
 */

import { HttpStatus } from '@nestjs/common';

import { OrmException } from './orm-exception';

/**
 * Thrown when a database foreign key constraint is violated.
 *
 * Wraps PostgreSQL error code `23503` (foreign_key_violation) with structured
 * metadata about the referencing and referenced tables.
 *
 * @example
 * ```typescript
 * try {
 *   await postService.create({ authorId: 'non-existent-user-id' });
 * } catch (error) {
 *   if (error instanceof ReferenceConstraintError) {
 *     console.log(error.constraintName);  // 'posts_author_id_fkey'
 *     console.log(error.referencingTable); // 'posts'
 *     console.log(error.referencedTable);  // 'users'
 *   }
 * }
 * ```
 */
export class ReferenceConstraintError extends OrmException {
  public readonly code = 'ORM_REFERENCE_CONSTRAINT';

  /**
   * @param constraintName - The FK constraint name that was violated
   * @param referencingTable - The table containing the FK column
   * @param referencedTable - The table being referenced
   */
  public constructor(
    public readonly constraintName: string,
    public readonly referencingTable: string,
    public readonly referencedTable: string
  ) {
    super(
      `Foreign key constraint "${constraintName}" violated: "${referencingTable}" references "${referencedTable}"`,
      HttpStatus.CONFLICT,
      { constraintName, referencingTable, referencedTable }
    );
  }
}
