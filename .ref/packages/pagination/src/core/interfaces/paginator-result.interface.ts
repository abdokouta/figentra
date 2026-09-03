/**
 * @file paginator-result.interface.ts
 * @module @stackra/ts-pagination/core/interfaces
 * @description Result shape interfaces for paginator output.
 */

// ════════════════════════════════════════════════════════════════════════════════
// Result Interfaces
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Serialized output of the LengthAwarePaginator.
 *
 * Matches Laravel's LengthAwarePaginator JSON format exactly,
 * using snake_case keys for API compatibility.
 */
export interface ILengthAwarePaginatorResult<T> {
  /** Current page number (1-indexed). */
  current_page: number;

  /** Array of items for the current page. */
  data: T[];

  /** URL for the first page. */
  first_page_url: string;

  /** Index of the first item on the current page (1-indexed), or null if empty. */
  from: number | null;

  /** Total number of pages. */
  last_page: number;

  /** URL for the last page. */
  last_page_url: string;

  /** URL for the next page, or null if on the last page. */
  next_page_url: string | null;

  /** Base path for URL generation. */
  path: string;

  /** Number of items per page. */
  per_page: number;

  /** URL for the previous page, or null if on the first page. */
  prev_page_url: string | null;

  /** Index of the last item on the current page (1-indexed), or null if empty. */
  to: number | null;

  /** Total number of items across all pages. */
  total: number;
}

/**
 * Serialized output of the SimplePaginator.
 *
 * Matches Laravel's Paginator (simple) JSON format exactly,
 * using snake_case keys for API compatibility.
 */
export interface ISimplePaginatorResult<T> {
  /** Current page number (1-indexed). */
  current_page: number;

  /** Array of items for the current page. */
  data: T[];

  /** URL for the first page. */
  first_page_url: string;

  /** Index of the first item on the current page (1-indexed), or null if empty. */
  from: number | null;

  /** URL for the next page, or null if no more pages. */
  next_page_url: string | null;

  /** Base path for URL generation. */
  path: string;

  /** Number of items per page. */
  per_page: number;

  /** URL for the previous page, or null if on the first page. */
  prev_page_url: string | null;

  /** Index of the last item on the current page (1-indexed), or null if empty. */
  to: number | null;
}

/**
 * Serialized output of the CursorPaginator.
 *
 * Matches Laravel's CursorPaginator JSON format exactly,
 * using snake_case keys for API compatibility.
 */
export interface ICursorPaginatorResult<T> {
  /** Array of items for the current page. */
  data: T[];

  /** Base path for URL generation. */
  path: string;

  /** Number of items per page. */
  per_page: number;

  /** Encoded cursor pointing to the next page, or null if no more pages. */
  next_cursor: string | null;

  /** URL for the next page including cursor, or null if no more pages. */
  next_page_url: string | null;

  /** Encoded cursor pointing to the previous page, or null if on the first page. */
  prev_cursor: string | null;

  /** URL for the previous page including cursor, or null if on the first page. */
  prev_page_url: string | null;
}
