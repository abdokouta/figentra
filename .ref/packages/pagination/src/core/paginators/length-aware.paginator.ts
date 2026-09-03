/**
 * @file length-aware.paginator.ts
 * @module @stackra/ts-pagination/core/paginators
 * @description Offset-based paginator with total count knowledge.
 *   Provides full pagination metadata including last page, total count,
 *   and first/last page URLs.
 */

import type { IPaginatorOptions, ILengthAwarePaginatorResult } from '../interfaces';
import { AbstractPaginator } from './abstract.paginator';

// ════════════════════════════════════════════════════════════════════════════════
// LengthAwarePaginator
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Offset-based paginator that knows the total number of items.
 *
 * Provides complete pagination metadata including last page calculation,
 * first/last page URLs, and total count. Use this when you can afford
 * the COUNT(*) query (small-to-medium datasets).
 *
 * @example
 * ```typescript
 * const paginator = new LengthAwarePaginator(items, 100, 15, 1, {
 *   path: '/api/users',
 * });
 *
 * paginator.total();       // 100
 * paginator.lastPage();    // 7
 * paginator.hasMorePages(); // true
 * ```
 */
export class LengthAwarePaginator<T> extends AbstractPaginator<T> {
  /** Total number of items across all pages. */
  private readonly _total: number;

  /** Computed last page number. */
  private readonly _lastPage: number;

  /**
   * @param items - Items for the current page
   * @param total - Total number of items across all pages
   * @param perPage - Number of items per page
   * @param currentPage - Current page number (1-indexed, defaults to 1)
   * @param options - Optional configuration for URL generation
   */
  public constructor(
    items: T[],
    total: number,
    perPage: number,
    currentPage: number = 1,
    options?: IPaginatorOptions
  ) {
    super(items, perPage, currentPage, options);
    this._total = Math.max(0, total);
    this._lastPage = Math.max(1, Math.ceil(this._total / this.perPage));
  }

  /**
   * Get the total number of items across all pages.
   *
   * @returns Total item count
   */
  public total(): number {
    return this._total;
  }

  /**
   * Get the last page number.
   *
   * @returns Last page number (1-indexed)
   */
  public lastPage(): number {
    return this._lastPage;
  }

  /**
   * Determine if there are more pages after the current one.
   *
   * @returns True if current page is less than last page
   */
  public hasMorePages(): boolean {
    return this.currentPage < this._lastPage;
  }

  /**
   * Serialize to Laravel's LengthAwarePaginator JSON format.
   *
   * @returns Serialized pagination result with snake_case keys
   */
  public toArray(): ILengthAwarePaginatorResult<T> {
    return {
      current_page: this.currentPage,
      data: this.items,
      first_page_url: this.url(1),
      from: this.firstItem(),
      last_page: this._lastPage,
      last_page_url: this.url(this._lastPage),
      next_page_url: this.nextPageUrl(),
      path: this.path,
      per_page: this.perPage,
      prev_page_url: this.previousPageUrl(),
      to: this.lastItem(),
      total: this._total,
    };
  }
}
