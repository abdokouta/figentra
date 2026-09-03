/**
 * @file use-pagination-return.interface.ts
 * @module @stackra/pagination/src/interfaces
 * @description IUsePaginationReturn interface.
 */

/**
 * Return value of the usePagination hook.
 */
export interface IUsePaginationReturn {
  /** Current page number (1-indexed). */
  page: number;

  /** Current items per page. */
  perPage: number;

  /** Total number of items (if provided). */
  total: number | undefined;

  /** Computed last page number (if total is provided). */
  lastPage: number | undefined;

  /** Whether the current page is the first page. */
  isFirstPage: boolean;

  /** Whether the current page is the last page (only known if total is provided). */
  isLastPage: boolean;

  /** Computed offset for database queries. */
  offset: number;

  /** Navigate to a specific page. */
  goToPage: (page: number) => void;

  /** Navigate to the next page. */
  nextPage: () => void;

  /** Navigate to the previous page. */
  previousPage: () => void;

  /** Navigate to the first page. */
  firstPage: () => void;

  /** Navigate to the last page (requires total). */
  lastPageNav: () => void;

  /** Update the per-page count (resets to page 1). */
  setPerPage: (perPage: number) => void;

  /** Update the total count. */
  setTotal: (total: number) => void;
}
