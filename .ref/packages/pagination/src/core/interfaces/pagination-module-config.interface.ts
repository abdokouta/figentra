/**
 * @file pagination-module-config.interface.ts
 * @module @stackra/pagination/src/interfaces
 * @description IPaginationModuleConfig interface.
 */

/**
 * Configuration options for the PaginationModule.
 *
 * Controls default pagination behavior across the application.
 */
export interface IPaginationModuleConfig {
  /** Default number of items per page. */
  defaultPerPage?: number;

  /** Maximum allowed items per page (caps user input). */
  maxPerPage?: number;

  /** Query parameter name for page number. */
  pageParam?: string;

  /** Query parameter name for items per page. */
  perPageParam?: string;

  /** Query parameter name for cursor value. */
  cursorParam?: string;
}
