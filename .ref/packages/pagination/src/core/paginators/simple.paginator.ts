/**
 * @file simple.paginator.ts
 * @module @stackra/ts-pagination/core/paginators
 * @description Simple offset-based paginator without total count.
 *   Determines if there are more pages by fetching perPage + 1 items
 *   and slicing to perPage for display.
 */

import type { IPaginatorOptions, ISimplePaginatorResult } from '../interfaces';
import { AbstractPaginator } from './abstract.paginator';

// ════════════════════════════════════════════════════════════════════════════════
// SimplePaginator
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Offset-based paginator that does NOT know the total count.
 *
 * Determines "has more" by receiving perPage + 1 items from the data source.
 * If more items were received than perPage, there are more pages. The extra
 * item is automatically sliced off for display.
 *
 * Use this when COUNT(*) is expensive (large datasets) and you only need
 * next/previous navigation.
 *
 * @example
 * ```typescript
 * // Fetch perPage + 1 items from the database
 * const fetched = await repo.find({}, { limit: 16 });
 * const paginator = new SimplePaginator(fetched, 15, 1, {
 *   path: '/api/posts',
 * });
 *
 * paginator.hasMorePages(); // true if 16 items were passed
 * paginator.getItems();     // only 15 items returned
 * ```
 */
export class SimplePaginator<T> extends AbstractPaginator<T> {
  /** Whether there are more pages beyond the current one. */
  private readonly _hasMore: boolean;

  /**
   * @param items - Items fetched (may include one extra for has_more detection)
   * @param perPage - Number of items per page
   * @param currentPage - Current page number (1-indexed, defaults to 1)
   * @param options - Optional configuration for URL generation
   */
  public constructor(
    items: T[],
    perPage: number,
    currentPage: number = 1,
    options?: IPaginatorOptions
  ) {
    const hasMore = items.length > perPage;
    const displayItems = hasMore ? items.slice(0, perPage) : items;

    super(displayItems, perPage, currentPage, options);
    this._hasMore = hasMore;
  }

  /**
   * Determine if there are more pages after the current one.
   *
   * Detected by whether the data source returned more items than perPage.
   *
   * @returns True if there are more pages
   */
  public hasMorePages(): boolean {
    return this._hasMore;
  }

  /**
   * Serialize to Laravel's simple Paginator JSON format.
   *
   * @returns Serialized pagination result with snake_case keys
   */
  public toArray(): ISimplePaginatorResult<T> {
    return {
      current_page: this.currentPage,
      data: this.items,
      first_page_url: this.url(1),
      from: this.firstItem(),
      next_page_url: this.nextPageUrl(),
      path: this.path,
      per_page: this.perPage,
      prev_page_url: this.previousPageUrl(),
      to: this.lastItem(),
    };
  }
}
