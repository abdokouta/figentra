/**
 * @file response.type.ts
 * @module @stackra/nestjs-orm/http/types
 * @description Type definitions for standardized REST API responses.
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Pagination links for navigating result pages.
 */
export interface PaginationLinks {
  /** URL to the current page. */
  self: string;
  /** URL to the first page. */
  first: string;
  /** URL to the last page. */
  last: string;
  /** URL to the next page (null if on last page). */
  next: string | null;
  /** URL to the previous page (null if on first page). */
  prev: string | null;
}

/**
 * Standardized paginated response envelope.
 */
export interface PaginatedResponse<T = any> {
  /** Array of items for the current page. */
  data: T[];
  /** Pagination metadata. */
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    count: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  /** Navigation links. */
  links: PaginationLinks;
}

/**
 * Standardized single entity response envelope.
 */
export interface EntityResponse<T = any> {
  /** The entity data. */
  data: T;
  /** HTTP status code. */
  statusCode: number;
}
