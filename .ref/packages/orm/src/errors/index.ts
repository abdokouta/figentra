/**
 * @file index.ts
 * @module @stackra/nestjs-orm/errors
 * @description Barrel export for ORM exception classes.
 */

// ============================================================================
// Base
// ============================================================================
export { OrmException } from './orm-exception';

// ============================================================================
// Constraint Errors
// ============================================================================
export { UniqueConstraintError } from './unique-constraint.error';
export { ReferenceConstraintError } from './reference-constraint.error';

// ============================================================================
// Lock Errors
// ============================================================================
export { OptimisticLockError } from './optimistic-lock.error';

// ============================================================================
// Connection Errors
// ============================================================================
export { DatabaseConnectionError } from './database-connection.error';

// ============================================================================
// Utilities
// ============================================================================
export { wrapFlushError } from './wrap-flush-error.util';
