/**
 * @file pagination-query.type.ts
 * @module @stackra/nestjs-orm/http/types
 * @description Type definitions for pagination query parameters.
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Raw pagination query parameters from the HTTP request.
 */
export interface PaginationQuery {
  /** Page number (1-indexed). */
  page?: string | number;
  /** Items per page (max 100). */
  limit?: string | number;
  /** Alias for limit. */
  per_page?: string | number;
  /** Sort specification (e.g., '-createdAt,name'). */
  sort?: string;
  /** Filter object or JSON string. */
  filter?: any;
}

/**
 * Parsed pagination parameters (validated and coerced).
 */
export interface ParsedPagination {
  /** Page number (1-indexed, minimum 1). */
  page: number;
  /** Items per page (clamped to 1-100). */
  limit: number;
}
