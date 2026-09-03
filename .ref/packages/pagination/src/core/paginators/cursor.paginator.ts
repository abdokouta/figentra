/**
 * @file cursor.paginator.ts
 * @module @stackra/ts-pagination/core/paginators
 * @description Cursor-based (keyset) paginator.
 *   Provides efficient pagination for large datasets by using a cursor
 *   pointer instead of offset-based page numbers.
 */

import type { ICursorPaginatorOptions, ICursorPaginatorResult } from '../interfaces';
import { Cursor } from '../value-objects/cursor';

// ════════════════════════════════════════════════════════════════════════════════
// CursorPaginator
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Cursor-based (keyset) paginator for efficient large-dataset pagination.
 *
 * Instead of using page numbers and offsets, cursor pagination uses an opaque
 * cursor that encodes the position in the dataset. This avoids the performance
 * degradation of OFFSET on large tables.
 *
 * The paginator receives perPage + 1 items to detect whether more pages exist.
 * It generates next/previous cursors from the first and last items' key columns.
 *
 * @example
 * ```typescript
 * const cursor = Cursor.fromEncoded(req.query.cursor);
 * const items = await fetchItemsAfterCursor(cursor, 16); // perPage + 1
 *
 * const paginator = new CursorPaginator(items, 15, cursor, {
 *   path: '/api/messages',
 *   parameters: ['id', 'created_at'],
 * });
 *
 * paginator.hasMorePages(); // true
 * paginator.nextCursor();   // Cursor pointing to next page
 * ```
 */
export class CursorPaginator<T> {
  /** Items for the current page (sliced to perPage). */
  private readonly items: T[];

  /** Number of items per page. */
  private readonly perPage: number;

  /** Current cursor used to reach this page, or null for the first page. */
  private readonly _cursor: Cursor | null;

  /** Base path for URL generation. */
  private readonly path: string;

  /** Additional query parameters for URL generation. */
  private readonly query: Record<string, string>;

  /** Query parameter name for the cursor. */
  private readonly cursorParam: string;

  /** Column names used for cursor-based ordering. */
  private readonly parameters: string[];

  /** Whether there are more pages after the current one. */
  private readonly _hasMore: boolean;

  /**
   * @param items - Items fetched (may include one extra for has_more detection)
   * @param perPage - Number of items per page
   * @param cursor - Current cursor, or null for the first page
   * @param options - Optional configuration for URL and cursor generation
   */
  public constructor(
    items: T[],
    perPage: number,
    cursor: Cursor | null,
    options?: ICursorPaginatorOptions
  ) {
    this.perPage = Math.max(1, perPage);
    this._cursor = cursor;
    this.path = options?.path ?? '/';
    this.query = options?.query ?? {};
    this.cursorParam = options?.cursorParam ?? 'cursor';
    this.parameters = options?.parameters ?? ['id'];

    this._hasMore = items.length > this.perPage;
    this.items = this._hasMore ? items.slice(0, this.perPage) : items;
  }

  /**
   * Get the current cursor used to reach this page.
   *
   * @returns Current cursor, or null if on the first page
   */
  public cursor(): Cursor | null {
    return this._cursor;
  }

  /**
   * Generate a cursor pointing to the next page of results.
   *
   * Built from the last item's key column values.
   *
   * @returns Cursor for the next page, or null if no more pages
   */
  public nextCursor(): Cursor | null {
    if (!this._hasMore || this.items.length === 0) {
      return null;
    }

    const lastItem = this.items[this.items.length - 1] as Record<string, unknown>;
    const params: Record<string, string> = {};

    for (const param of this.parameters) {
      const value = lastItem[param];
      if (value != null) {
        params[param] = String(value);
      }
    }

    return new Cursor(params, true);
  }

  /**
   * Generate a cursor pointing to the previous page of results.
   *
   * Built from the first item's key column values.
   *
   * @returns Cursor for the previous page, or null if on the first page
   */
  public previousCursor(): Cursor | null {
    if (!this._cursor || this.items.length === 0) {
      return null;
    }

    const firstItem = this.items[0] as Record<string, unknown>;
    const params: Record<string, string> = {};

    for (const param of this.parameters) {
      const value = firstItem[param];
      if (value != null) {
        params[param] = String(value);
      }
    }

    return new Cursor(params, false);
  }

  /**
   * Determine if there are more pages after the current one.
   *
   * @returns True if there are more pages
   */
  public hasMorePages(): boolean {
    return this._hasMore;
  }

  /**
   * Determine if there are enough items to warrant pagination.
   *
   * @returns True if there is a cursor or more pages exist
   */
  public hasPages(): boolean {
    return this._cursor !== null || this._hasMore;
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
   * Get the number of items on the current page.
   *
   * @returns Item count
   */
  public count(): number {
    return this.items.length;
  }

  /**
   * Determine if the current page has no items.
   *
   * @returns True if empty
   */
  public isEmpty(): boolean {
    return this.items.length === 0;
  }

  /**
   * Determine if the current page has items.
   *
   * @returns True if not empty
   */
  public isNotEmpty(): boolean {
    return this.items.length > 0;
  }

  /**
   * Serialize to Laravel's CursorPaginator JSON format.
   *
   * @returns Serialized pagination result with snake_case keys
   */
  public toArray(): ICursorPaginatorResult<T> {
    const nextCursor = this.nextCursor();
    const prevCursor = this.previousCursor();

    return {
      data: this.items,
      path: this.path,
      per_page: this.perPage,
      next_cursor: nextCursor?.encode() ?? null,
      next_page_url: this.buildCursorUrl(nextCursor),
      prev_cursor: prevCursor?.encode() ?? null,
      prev_page_url: this.buildCursorUrl(prevCursor),
    };
  }

  /**
   * Serialize the paginator to JSON (delegates to toArray).
   *
   * @returns Serialized pagination result
   */
  public toJSON(): ICursorPaginatorResult<T> {
    return this.toArray();
  }

  /**
   * Build a URL with the cursor query parameter.
   *
   * @param cursor - Cursor to encode into the URL, or null
   * @returns Full URL with cursor parameter, or null if cursor is null
   */
  private buildCursorUrl(cursor: Cursor | null): string | null {
    if (!cursor) {
      return null;
    }

    const params = new URLSearchParams({
      ...this.query,
      [this.cursorParam]: cursor.encode(),
    });

    return `${this.path}?${params.toString()}`;
  }
}
