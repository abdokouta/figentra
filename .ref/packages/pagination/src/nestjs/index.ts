/**
 * @file index.ts
 * @module @stackra/ts-pagination/nestjs
 * @description Public API for the @stackra/ts-pagination NestJS subpath.
 *   Provides middleware, decorators, and interceptors for NestJS integration.
 */

// ════════════════════════════════════════════════════════════════════════════════
// Module
// ════════════════════════════════════════════════════════════════════════════════
export { NestPaginationModule } from './nest-pagination.module';
export type { INestPaginationModuleConfig } from './nest-pagination.module';

// ════════════════════════════════════════════════════════════════════════════════
// Middleware
// ════════════════════════════════════════════════════════════════════════════════
export { PaginationResolverMiddleware } from './middleware';

// ════════════════════════════════════════════════════════════════════════════════
// Decorators
// ════════════════════════════════════════════════════════════════════════════════
export { Paginated, PAGINATED_METADATA_KEY, type IPaginatedOptions } from './decorators';
export { PaginationContext, Page, PerPage, CursorParam } from './decorators';
export { CursorPaginate, type ICursorParams } from './decorators';

// ════════════════════════════════════════════════════════════════════════════════
// Pipes
// ════════════════════════════════════════════════════════════════════════════════
export {
  PaginationValidationPipe,
  type IValidatedPaginationParams,
  type IPaginationValidationConfig,
} from './pipes';

// ════════════════════════════════════════════════════════════════════════════════
// Interceptors
// ════════════════════════════════════════════════════════════════════════════════
export { PaginationResponseInterceptor } from './interceptors';

// ════════════════════════════════════════════════════════════════════════════════
// Re-exports from Core
// ════════════════════════════════════════════════════════════════════════════════
export {
  PaginationModule,
  PAGINATION_CONFIG,
  AbstractPaginator,
  LengthAwarePaginator,
  SimplePaginator,
  CursorPaginator,
  KeysetPaginator,
  PaginationLinkBuilder,
  Cursor,
  paginationStorage,
  getCurrentPagination,
  getCurrentPage,
  getCurrentPerPage,
  getCurrentCursor,
} from '../core/index';

export type {
  IPaginationModuleConfig,
  IPaginatorOptions,
  ICursorPaginatorOptions,
  IPaginationContext,
  IPaginationLinks,
  ILengthAwarePaginatorResult,
  ISimplePaginatorResult,
  ICursorPaginatorResult,
} from '../core/index';
