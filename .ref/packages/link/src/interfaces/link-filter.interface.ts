/**
 * @file link-filter.interface.ts
 * @module @stackra/nestjs-link/interfaces
 * @description Filter and pagination options for link query operations.
 *
 * Used by `LinkService.list()` and `LinkModuleService.list()` to control
 * which pivot records are returned and in what order.
 *
 * @example
 * ```typescript
 * const records = await linkService.list({
 *   where: { role_id: 'role_123' },
 *   orderBy: { created_at: 'DESC' },
 *   limit: 10,
 *   offset: 0,
 * });
 * ```
 */

/**
 * Sort direction for ordering results.
 */
export type SortDirection = 'ASC' | 'DESC' | 'asc' | 'desc';

/**
 * Filter options for querying link (pivot) records.
 */
export interface ILinkFilter {
  /**
   * Filter conditions as key-value pairs.
   * Keys are column names on the pivot table.
   * Values can be:
   * - A single value (exact match)
   * - An array (IN clause)
   * - An object with operators like `$in`, `$nin`, `$ne`, `$gt`, `$lt`, etc.
   */
  where?: Record<string, any>;

  /**
   * Ordering of results.
   * Keys are column names, values are sort direction.
   *
   * @example
   * ```typescript
   * orderBy: { created_at: 'DESC', sort_order: 'ASC' }
   * ```
   */
  orderBy?: Record<string, SortDirection>;

  /**
   * Maximum number of records to return.
   * @default undefined (no limit)
   */
  limit?: number;

  /**
   * Number of records to skip (for pagination).
   * @default 0
   */
  offset?: number;

  /**
   * Whether to include soft-deleted records in the results.
   * Only relevant when the link has `softDeletes: true`.
   * @default false
   */
  withDeleted?: boolean;
}
