/**
 * @file wrap-flush-error.util.ts
 * @module @stackra/nestjs-orm/errors
 * @description Utility that wraps `em.flush()` calls and maps raw PostgreSQL
 *   and MikroORM errors to typed ORM exception classes.
 */

import { UniqueConstraintError } from './unique-constraint.error';
import { ReferenceConstraintError } from './reference-constraint.error';
import { OptimisticLockError } from './optimistic-lock.error';
import { DatabaseConnectionError } from './database-connection.error';

// ============================================================================
// PostgreSQL Error Code Constants
// ============================================================================

/** PostgreSQL error code for unique_violation. */
const PG_UNIQUE_VIOLATION = '23505';

/** PostgreSQL error code for foreign_key_violation. */
const PG_FK_VIOLATION = '23503';

// ============================================================================
// Error Detection Helpers
// ============================================================================

/**
 * Extracts constraint name from a PostgreSQL driver error.
 *
 * @param error - The raw database error
 * @returns The constraint name if available, otherwise 'unknown'
 */
function extractConstraintName(error: any): string {
  // PostgreSQL driver (pg) and MikroORM both expose constraint info
  return (
    error.constraint ||
    error.detail?.match(/constraint "([^"]+)"/)?.[1] ||
    error.message?.match(/constraint "([^"]+)"/)?.[1] ||
    'unknown'
  );
}

/**
 * Extracts conflicting field values from a PostgreSQL unique violation.
 *
 * @param error - The raw database error
 * @returns Map of field names to conflicting values
 */
function extractConflictingFields(error: any): Record<string, unknown> {
  const fields: Record<string, unknown> = {};

  // PostgreSQL detail format: Key (email)=(test@test.com) already exists.
  const detail: string = error.detail || '';
  const match = detail.match(/Key \(([^)]+)\)=\(([^)]+)\)/);

  if (match) {
    const columns = match[1]!.split(', ');
    const values = match[2]!.split(', ');
    for (let i = 0; i < columns.length; i++) {
      fields[columns[i]!.trim()] = values[i]?.trim() ?? null;
    }
  }

  return fields;
}

/**
 * Extracts table names from a PostgreSQL FK violation error detail.
 *
 * @param error - The raw database error
 * @returns Tuple of [referencingTable, referencedTable]
 */
function extractFkTables(error: any): [string, string] {
  const detail: string = error.detail || error.message || '';

  // Pattern: on table "posts" violates foreign key constraint ... references "users"
  const tableMatch = detail.match(/on table "([^"]+)"/);
  const refMatch = detail.match(/references "([^"]+)"/);

  // Alternative pattern from MikroORM: table "referencing" referenced "referenced"
  const altMatch = error.table || '';

  return [tableMatch?.[1] || altMatch || 'unknown', refMatch?.[1] || 'unknown'];
}

/**
 * Checks if an error is a MikroORM OptimisticLockError.
 *
 * @param error - The error to check
 * @returns True if this is an optimistic lock conflict
 */
function isMikroOrmOptimisticLockError(error: any): boolean {
  return (
    error?.name === 'OptimisticLockError' ||
    error?.constructor?.name === 'OptimisticLockError' ||
    error?.message?.includes('optimistic lock')
  );
}

/**
 * Checks if an error is a database connection error.
 *
 * @param error - The error to check
 * @returns True if this is a connection failure
 */
function isConnectionError(error: any): boolean {
  const code = error?.code || '';
  const message = (error?.message || '').toLowerCase();

  return (
    code === 'ECONNREFUSED' ||
    code === 'ENOTFOUND' ||
    code === 'ETIMEDOUT' ||
    code === 'ECONNRESET' ||
    message.includes('connection refused') ||
    message.includes('connection terminated') ||
    message.includes('connection timeout') ||
    message.includes('could not connect')
  );
}

// ============================================================================
// Main Utility
// ============================================================================

/**
 * Wraps a flush operation and maps raw database errors to typed ORM exceptions.
 *
 * Use this utility to wrap `em.flush()` calls in service methods. It catches
 * raw PostgreSQL and MikroORM errors and throws the appropriate typed exception
 * class, enabling consumers to catch specific error types.
 *
 * Unmapped errors pass through unchanged.
 *
 * @param operation - The async operation to wrap (typically `() => em.flush()`)
 * @param connectionName - The connection name for connection error context (default: 'default')
 * @returns The result of the operation if successful
 * @throws {UniqueConstraintError} On PostgreSQL unique_violation (23505)
 * @throws {ReferenceConstraintError} On PostgreSQL foreign_key_violation (23503)
 * @throws {OptimisticLockError} On MikroORM optimistic lock conflict
 * @throws {DatabaseConnectionError} On connection failure
 *
 * @example
 * ```typescript
 * async create(input: CreateProductDto): Promise<Product> {
 *   const entity = em.create(Product, input);
 *   em.persist(entity);
 *   await wrapFlushError(() => em.flush());
 *   return entity;
 * }
 * ```
 */
export async function wrapFlushError<T>(
  operation: () => Promise<T>,
  connectionName: string = 'default'
): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    // 1. PostgreSQL unique constraint violation (23505)
    if (error?.code === PG_UNIQUE_VIOLATION || error?.driverError?.code === PG_UNIQUE_VIOLATION) {
      const rawError = error.driverError || error;
      throw new UniqueConstraintError(
        extractConstraintName(rawError),
        extractConflictingFields(rawError)
      );
    }

    // 2. PostgreSQL foreign key constraint violation (23503)
    if (error?.code === PG_FK_VIOLATION || error?.driverError?.code === PG_FK_VIOLATION) {
      const rawError = error.driverError || error;
      const [referencingTable, referencedTable] = extractFkTables(rawError);
      throw new ReferenceConstraintError(
        extractConstraintName(rawError),
        referencingTable,
        referencedTable
      );
    }

    // 3. MikroORM optimistic lock error
    if (isMikroOrmOptimisticLockError(error)) {
      const entityName = error.entityName || error.entity?.constructor?.name || 'Unknown';
      const entityId = error.entity?.id || 'unknown';
      const expectedVersion = error.expectedLockVersion ?? error.expectedVersion ?? 0;
      const actualVersion = error.actualLockVersion ?? error.actualVersion ?? 0;
      throw new OptimisticLockError(entityName, String(entityId), expectedVersion, actualVersion);
    }

    // 4. Connection errors
    if (isConnectionError(error) || isConnectionError(error?.driverError)) {
      const rawError = error.driverError || error;
      throw new DatabaseConnectionError(connectionName, rawError.message || String(rawError));
    }

    // 5. Unmapped errors pass through unchanged
    throw error;
  }
}
