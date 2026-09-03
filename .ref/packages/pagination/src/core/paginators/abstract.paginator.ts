/**
 * @file abstract.paginator.ts
 * @module @stackra/ts-pagination/core/paginators
 * @description Abstract base class for offset-based paginators.
 *   Provides shared logic for page URL generation, item access, and
 *   common pagination metadata.
 */

import type { IPaginatorOptions } from '../interfaces';

// ════════════════════════════════════════════════════════════════════════════════
// Abstract Paginator
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Abstract base class for offset-based paginators.
 *
 * Encapsulates common pagination logic including:
 * - Item collection access
 * - Page URL generation with query parameters
 * - First/last item index calculation
 * - Empty state detection
 *
 * Subclasses implement `hasMorePages()` and `toArray()` based on
 * their specific pagination strategy (length-aware vs simple).
 */
export abstract class AbstractPaginator<T> {
  /** The items for the current page. */
  protected items: T[];

  /** Number of items per page. */
  protected perPage: number;

  /** Current page number (1-indexed). */
  protected currentPage: number;

  /** Base path for URL generation. */
  protected path: string;

  /** Additional query parameters for URL generation. */
  protected query: Record<string, string>;

  /** Query parameter name for page number. */
  protected pageParam: string;

  /**
   * @param items - Items for the current page
   * @param perPage - Number of items per page
   * @param currentPage - Current page number (1-indexed)
   * @param options - Optional configuration for URL generation
   */
  public constructor(
    items: T[],
    perPage: number,
    currentPage: number,
    options?: IPaginatorOptions
  ) {
    this.items = items;
    this.perPage = Math.max(1, perPage);
    this.currentPage = Math.max(1, currentPage);
    this.path = options?.path ?? '/';
    this.query = options?.query ?? {};
    this.pageParam = options?.pageParam ?? 'page';
  }

  /**
   * Get the number of items on the current page.
   *
   * @returns Item count for this page
   */
  public count(): number {
    return this.items.length;
  }

  /**
   * Determine if the current page has no items.
   *
   * @returns True if there are no items
   */
  public isEmpty(): boolean {
    return this.items.length === 0;
  }

  /**
   * Determine if the current page has items.
   *
   * @returns True if there are items
   */
  public isNotEmpty(): boolean {
    return this.items.length > 0;
  }

  /**
   * Get all items for the current page.
   *
   * @returns Array of items
   */
  public getItems(): T[] {
    return this.items;
  }

  /**
   * Get the number of items shown per page.
   *
   * @returns Per-page count
   */
  public perPageCount(): number {
    return this.perPage;
  }

  /**
   * Get the current page number.
   *
   * @returns Current page number (1-indexed)
   */
  public currentPageNumber(): number {
    return this.currentPage;
  }

  /**
   * Determine if there are enough items to split into multiple pages.
   *
   * @returns True if current page is not 1 or there are more pages
   */
  public hasPages(): boolean {
    return this.currentPage !== 1 || this.hasMorePages();
  }

  /**
   * Get the 1-indexed position of the first item on the current page.
   *
   * @returns First item index, or null if empty
   */
  public firstItem(): number | null {
    if (this.items.length === 0) {
      return null;
    }

    return (this.currentPage - 1) * this.perPage + 1;
  }

  /**
   * Get the 1-indexed position of the last item on the current page.
   *
   * @returns Last item index, or null if empty
   */
  public lastItem(): number | null {
    if (this.items.length === 0) {
      return null;
    }

    return (this.currentPage - 1) * this.perPage + this.items.length;
  }

  /**
   * Generate a URL for a specific page number.
   *
   * @param page - Target page number
   * @returns Full URL with query parameters
   */
  public url(page: number): string {
    const params = new URLSearchParams({
      ...this.query,
      [this.pageParam]: String(page),
    });

    return `${this.path}?${params.toString()}`;
  }

  /**
   * Get the URL for the previous page.
   *
   * @returns Previous page URL, or null if on the first page
   */
  public previousPageUrl(): string | null {
    if (this.currentPage <= 1) {
      return null;
    }

    return this.url(this.currentPage - 1);
  }

  /**
   * Get the URL for the next page.
   *
   * @returns Next page URL, or null if no more pages
   */
  public nextPageUrl(): string | null {
    if (!this.hasMorePages()) {
      return null;
    }

    return this.url(this.currentPage + 1);
  }

  /**
   * Determine if there are more pages after the current one.
   *
   * @returns True if there are more pages
   */
  public abstract hasMorePages(): boolean;

  /**
   * Serialize the paginator to a plain object matching Laravel's format.
   *
   * @returns Serialized pagination result with snake_case keys
   */
  public abstract toArray(): object;

  /**
   * Serialize the paginator to JSON (delegates to toArray).
   *
   * @returns Serialized pagination result
   */
  public toJSON(): object {
    return this.toArray();
  }
}
