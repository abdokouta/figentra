/**
 * @file pagination-context.interface.ts
 * @module @stackra/pagination/src/interfaces
 * @description IPaginationContext interface.
 */

/**
 * Pagination context stored per-request via AsyncLocalStorage.
 *
 * Contains all pagination parameters resolved from the incoming request
 * query parameters.
 */
export interface IPaginationContext {
  /** Current page number (1-indexed). */
  page: number;

  /** Number of items per page. */
  perPage: number;

  /** Decoded cursor for keyset pagination, or null for offset-based. */
  cursor: Cursor | null;

  /** Sort field name, if provided. */
  sort?: string;

  /** Sort direction. */
  order?: 'asc' | 'desc';
}
