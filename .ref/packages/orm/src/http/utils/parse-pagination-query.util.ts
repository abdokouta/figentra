/**
 * @file parse-pagination-query.util.ts
 * @module @stackra/nestjs-orm/http/utils
 * @description Parses and validates pagination query parameters from HTTP requests.
 */

import type { ParsedPagination } from '../types/pagination-query.type';

// ============================================================================
// Constants
// ============================================================================

/** Maximum items per page. */
const MAX_LIMIT = 100;
/** Default items per page. */
const DEFAULT_LIMIT = 20;
/** Default page number. */
const DEFAULT_PAGE = 1;

// ============================================================================
// Utility
// ============================================================================

/**
 * Parse pagination query parameters into validated numeric values.
 *
 * Clamps `page` to minimum 1 and `limit` to range [1, 100].
 *
 * @param query - Raw query parameters from the HTTP request.
 * @returns Parsed and validated pagination parameters.
 */
export function parsePaginationQuery(query: any): ParsedPagination {
  const rawPage = query?.page ?? query?.p ?? DEFAULT_PAGE;
  const rawLimit = query?.limit ?? query?.per_page ?? query?.perPage ?? DEFAULT_LIMIT;

  const page = Math.max(1, Math.floor(Number(rawPage)) || DEFAULT_PAGE);
  const limit = Math.min(MAX_LIMIT, Math.max(1, Math.floor(Number(rawLimit)) || DEFAULT_LIMIT));

  return { page, limit };
}
