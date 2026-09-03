/**
 * @file pagination-link-builder.service.ts
 * @module @stackra/pagination/core/links
 * @description Service for building HATEOAS pagination navigation links.
 *   Supports offset-based and cursor-based link generation.
 */

import { IInjectable } from '@stackra/ts-container';

// ============================================================================
// Types
// ============================================================================

// ============================================================================
// Service
// ============================================================================

/**
 * Pagination link builder service.
 *
 * Constructs HATEOAS-compliant navigation links for paginated API responses.
 * Supports both offset-based (page/limit) and cursor-based (after/before).
 *
 * @example
 * ```typescript
 * const builder = new PaginationLinkBuilder();
 * const links = builder.buildOffsetLinks('/api/users', 2, 10, 20);
 * // { self: '/api/users?page=2&limit=20', first: '...', next: '...', ... }
 * ```
 */
@IInjectable()
export class PaginationLinkBuilder {
  /**
   * Build navigation links for offset-based pagination.
   *
   * @param baseUrl - Base URL without pagination query parameters
   * @param page - Current page number (1-indexed)
   * @param lastPage - Last page number (1-indexed)
   * @param limit - Items per page (for query param)
   * @returns HATEOAS navigation links
   */
  public buildOffsetLinks(
    baseUrl: string,
    page: number,
    lastPage: number,
    limit?: number
  ): IPaginationLinks {
    const buildUrl = (p: number): string => {
      const params = new URLSearchParams({ page: String(p) });
      if (limit) params.set('limit', String(limit));
      return `${baseUrl}?${params.toString()}`;
    };

    return {
      self: buildUrl(page),
      first: buildUrl(1),
      last: buildUrl(lastPage),
      next: page < lastPage ? buildUrl(page + 1) : null,
      prev: page > 1 ? buildUrl(page - 1) : null,
    };
  }

  /**
   * Build navigation links for cursor-based pagination.
   *
   * @param baseUrl - Base URL without pagination query parameters
   * @param endCursor - Cursor for the last item on the current page
   * @param startCursor - Cursor for the first item on the current page
   * @param hasNext - Whether a next page exists
   * @param hasPrev - Whether a previous page exists
   * @param limit - Items per page (for query param)
   * @returns HATEOAS navigation links
   */
  public buildCursorLinks(
    baseUrl: string,
    endCursor: string | null,
    startCursor: string | null,
    hasNext: boolean,
    hasPrev: boolean,
    limit?: number
  ): IPaginationLinks {
    const buildUrl = (cursor: string, direction: 'after' | 'before'): string => {
      const params = new URLSearchParams({ [direction]: cursor });
      if (limit) params.set('limit', String(limit));
      return `${baseUrl}?${params.toString()}`;
    };

    return {
      self: baseUrl,
      first: baseUrl,
      last: null,
      next: hasNext && endCursor ? buildUrl(endCursor, 'after') : null,
      prev: hasPrev && startCursor ? buildUrl(startCursor, 'before') : null,
    };
  }
}
