/**
 * @file link-column.interface.ts
 * @module @stackra/nestjs-link/interfaces
 * @description Defines the shape of extra columns on a link's pivot table.
 *
 * Beyond the two FK columns (source_id, target_id), links can carry
 * additional data on the pivot row — e.g., `sort_order`, `quantity`,
 * `metadata`, etc. This interface describes how those columns are defined.
 *
 * ## Supported Column Types
 * Maps directly to MikroORM/PostgreSQL column types:
 * - `string` → VARCHAR(255)
 * - `text` → TEXT
 * - `integer` → INTEGER
 * - `float` → DOUBLE PRECISION
 * - `boolean` → BOOLEAN
 * - `json` → JSONB
 * - `date` → TIMESTAMPTZ
 * - `uuid` → UUID
 *
 * @example
 * ```typescript
 * const columns: Record<string, LinkColumnDefinition> = {
 *   sort_order: { type: 'integer', default: 0 },
 *   metadata: { type: 'json', nullable: true },
 * };
 * ```
 */

/**
 * Allowed column types for extra pivot table columns.
 * These map to MikroORM property types and underlying PostgreSQL types.
 */
export type LinkColumnType =
  | 'string'
  | 'text'
  | 'integer'
  | 'float'
  | 'boolean'
  | 'json'
  | 'date'
  | 'uuid';

/**
 * Definition of a single extra column on a link's pivot table.
 */
export interface ILinkColumnDefinition {
  /**
   * The data type of the column.
   * Determines the PostgreSQL column type and MikroORM property type.
   */
  type: LinkColumnType;

  /**
   * Whether the column allows NULL values.
   * @default false
   */
  nullable?: boolean;

  /**
   * Default value for the column.
   * Can be a static value or a raw SQL expression string (e.g., 'CURRENT_TIMESTAMP').
   * If a string starting with 'raw:' is provided, it's treated as raw SQL.
   */
  default?: any;

  /**
   * Whether this column should be indexed for faster queries.
   * @default false
   */
  indexed?: boolean;
}
