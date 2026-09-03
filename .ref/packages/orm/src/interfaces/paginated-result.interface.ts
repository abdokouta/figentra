/**
 * @file paginated-result.interface.ts
 * @module @stackra/orm/src/interfaces
 * @description IPaginatedResult interface.
 */

/** Paginated result structure returned by the `paginate()` method. */
export interface IPaginatedResult<T> {
  /** The entities for the current page. */
  items: T[];
  /** Pagination metadata. */
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    count: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
