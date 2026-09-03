/**
 * @file define-service-options.interface.ts
 * @module @stackra/orm/src/interfaces
 * @description DefineServiceOptions interface.
 */

/**
 * Optional overrides for the generated service.
 */
export interface DefineServiceOptions {
  /** Custom where builder. If not provided, auto-generates from entity traits. */
  buildWhere?: (
    filter: any,
    options?: { withTrashed?: boolean; onlyTrashed?: boolean }
  ) => Record<string, any>;
  /** Custom sort builder. If not provided, uses buildSortQuery. */
  buildSort?: (sort: any) => Record<string, 'asc' | 'desc'> | undefined;
}
