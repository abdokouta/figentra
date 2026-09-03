/**
 * @file paginator-options.interface.ts
 * @module @stackra/ts-pagination/core/interfaces
 * @description Configuration options for offset-based and cursor-based paginators.
 */

// ════════════════════════════════════════════════════════════════════════════════
// Paginator Options
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Configuration options for offset-based paginators.
 *
 * Controls base path and extra query parameters appended to generated URLs.
 */
export interface IPaginatorOptions {
  /** Base path for URL generation (e.g., '/api/users'). */
  path?: string;

  /** Additional query parameters to include in generated URLs. */
  query?: Record<string, string>;

  /** Query parameter name for the page number. */
  pageParam?: string;
}

/**
 * Configuration options for the cursor-based paginator.
 *
 * Extends base paginator options with cursor-specific parameters used
 * for keyset pagination.
 */
export interface ICursorPaginatorOptions {
  /** Base path for URL generation (e.g., '/api/users'). */
  path?: string;

  /** Additional query parameters to include in generated URLs. */
  query?: Record<string, string>;

  /** Query parameter name for the cursor value. */
  cursorParam?: string;

  /** Column names used for cursor-based ordering. */
  parameters?: string[];
}
