/**
 * @file format-paginated-response.util.ts
 * @module @stackra/nestjs-orm/http/utils
 * @description Formats a paginated query result into a standardized REST response.
 */

import type { PaginatedResponse } from '../types/response.type';

// ============================================================================
// Utility
// ============================================================================

/**
 * Format a paginated result into the standard REST response envelope.
 *
 * @param result - The raw pagination result from a CRUD service.
 * @returns A standardized paginated response.
 */
export function formatPaginatedResponse<T>(result: any): PaginatedResponse<T> {
  const items = result.items ?? result.data ?? [];
  const total = result.meta?.total ?? result.total ?? 0;
  const page = result.meta?.page ?? result.page ?? 1;
  const limit = result.meta?.limit ?? result.limit ?? 20;
  const totalPages = Math.ceil(total / limit) || 1;
  const count = items.length;
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  return {
    data: items,
    meta: {
      total,
      page,
      limit,
      totalPages,
      count,
      hasNextPage,
      hasPreviousPage,
    },
    links: {
      self: `?page=${page}&limit=${limit}`,
      first: `?page=1&limit=${limit}`,
      last: `?page=${totalPages}&limit=${limit}`,
      next: hasNextPage ? `?page=${page + 1}&limit=${limit}` : null,
      prev: hasPreviousPage ? `?page=${page - 1}&limit=${limit}` : null,
    },
  };
}
