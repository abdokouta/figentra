/**
 * @file auditable-config.interface.ts
 * @module @stackra/orm/src/interfaces
 * @description IAuditableConfig interface.
 */

/**
 * Configuration for the @Auditable() trait.
 */
export interface IAuditableConfig {
  /** Fields to exclude from audit logging (e.g., 'password', 'token'). */
  exclude?: string[];
  /** Whether to log create operations (default: true). */
  logCreates?: boolean;
  /** Whether to log update operations (default: true). */
  logUpdates?: boolean;
  /** Whether to log delete operations (default: true). */
  logDeletes?: boolean;
}
