/**
 * @file use-pagination-options.interface.ts
 * @module @stackra/pagination/src/interfaces
 * @description IUsePaginationOptions interface.
 */

/**
 * Options for the usePagination hook.
 */
export interface IUsePaginationOptions {
  /** Initial page number (defaults to 1). */
  initialPage?: number;

  /** Initial items per page (defaults to 15). */
  initialPerPage?: number;

  /** Total number of items (enables last page calculation). */
  total?: number;
}
