/**
 * @file index.ts
 * @module @stackra/ts-pagination/core
 * @description Public API for the @stackra/ts-pagination core package.
 *   Provides LengthAware, Simple, and Cursor paginators plus value objects
 *   for pagination state management.
 */

// ════════════════════════════════════════════════════════════════════════════════
// Module
// ════════════════════════════════════════════════════════════════════════════════
export { PaginationModule } from './pagination.module';
export type { IPaginationModuleConfig } from './pagination.module';

// ════════════════════════════════════════════════════════════════════════════════
// Constants
// ════════════════════════════════════════════════════════════════════════════════
export { PAGINATION_CONFIG, DEFAULT_CONFIG } from './constants';

// ════════════════════════════════════════════════════════════════════════════════
// Paginators
// ════════════════════════════════════════════════════════════════════════════════
export { AbstractPaginator } from './paginators';
export { LengthAwarePaginator } from './paginators';
export { SimplePaginator } from './paginators';
export { CursorPaginator } from './paginators';
export { KeysetPaginator } from './paginators';

// ════════════════════════════════════════════════════════════════════════════════
// Link Builder
// ════════════════════════════════════════════════════════════════════════════════
export { PaginationLinkBuilder, type IPaginationLinks } from './links';

// ════════════════════════════════════════════════════════════════════════════════
// Value Objects
// ════════════════════════════════════════════════════════════════════════════════
export { Cursor } from './value-objects';
export {
  paginationStorage,
  getCurrentPagination,
  getCurrentPage,
  getCurrentPerPage,
  getCurrentCursor,
} from './value-objects';
export type { IPaginationContext } from './value-objects';

// ════════════════════════════════════════════════════════════════════════════════
// Interfaces
// ════════════════════════════════════════════════════════════════════════════════
export type {
  IPaginatorOptions,
  ICursorPaginatorOptions,
  ILengthAwarePaginatorResult,
  ISimplePaginatorResult,
  ICursorPaginatorResult,
} from './interfaces';

// ════════════════════════════════════════════════════════════════════════════════
// Utilities
// ════════════════════════════════════════════════════════════════════════════════
export { defineConfig } from './utils';
