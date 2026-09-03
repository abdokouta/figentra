/**
 * @file keyset.paginator.ts
 * @module @stackra/pagination/core/paginators
 * @description Keyset paginator with multi-column cursor support.
 *   Extends CursorPaginator to encode multiple sort fields into a single cursor,
 *   preventing pagination instability when records share timestamps.
 */

import { CursorPaginator } from './cursor.paginator';
import { Cursor } from '../value-objects/cursor';
import type { ICursorPaginatorOptions } from '../interfaces';

// ============================================================================
// Keyset Paginator
// ============================================================================

/**
 * Keyset paginator for multi-column cursor pagination.
 *
 * Encodes multiple sort fields (e.g., `createdAt` + `id`) into a single cursor,
 * ensuring stable pagination even when records share the same timestamp.
 *
 * @typeParam T - The type of items being paginated
 *
 * @example
 * ```typescript
 * const paginator = new KeysetPaginator(items, 20, null, {
 *   path: '/api/events',
 *   parameters: ['created_at', 'id'],
 * });
 *
 * const result = paginator.toArray();
 * // Cursors encode both created_at AND id for stable ordering
 * ```
 */
export class KeysetPaginator<T> extends CursorPaginator<T> {
  /**
   * @param items - Items fetched (may include one extra for has_more detection)
   * @param perPage - Number of items per page
   * @param cursor - Current cursor, or null for the first page
   * @param options - Configuration with `parameters` specifying keyset fields
   */
  public constructor(
    items: T[],
    perPage: number,
    cursor: Cursor | null,
    options?: ICursorPaginatorOptions
  ) {
    super(items, perPage, cursor, {
      ...options,
      parameters: options?.parameters ?? ['created_at', 'id'],
    });
  }
}
