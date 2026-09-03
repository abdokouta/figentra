/**
 * @file optimistic-lock.error.ts
 * @module @stackra/nestjs-orm/errors
 * @description Thrown when an optimistic lock conflict occurs during flush on a @Versionable() entity.
 */

import { HttpStatus } from '@nestjs/common';

import { OrmException } from './orm-exception';

/**
 * Thrown when an optimistic lock conflict is detected.
 *
 * Occurs when a `@Versionable()` entity's version in the database no longer
 * matches the version that was loaded, indicating a concurrent modification.
 *
 * @example
 * ```typescript
 * try {
 *   await productService.update({ id: 'abc', name: 'Updated' });
 * } catch (error) {
 *   if (error instanceof OptimisticLockError) {
 *     console.log(error.entityName);      // 'Product'
 *     console.log(error.entityId);        // 'abc'
 *     console.log(error.expectedVersion); // 3
 *     console.log(error.actualVersion);   // 4
 *   }
 * }
 * ```
 */
export class OptimisticLockError extends OrmException {
  public readonly code = 'ORM_OPTIMISTIC_LOCK';

  /**
   * @param entityName - The entity class name
   * @param entityId - The entity's primary key value
   * @param expectedVersion - The version the service expected to find
   * @param actualVersion - The version currently in the database
   */
  public constructor(
    public readonly entityName: string,
    public readonly entityId: string,
    public readonly expectedVersion: number,
    public readonly actualVersion: number
  ) {
    super(
      `Optimistic lock failed for ${entityName}#${entityId}: expected version ${expectedVersion}, found ${actualVersion}`,
      HttpStatus.CONFLICT,
      { entityName, entityId, expectedVersion, actualVersion }
    );
  }
}
