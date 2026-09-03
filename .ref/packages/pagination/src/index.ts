/**
 * @file index.ts
 * @module @stackra/ts-pagination
 * @description Root barrel — re-exports the core subpath for backwards compatibility.
 *   Consumers should use subpath imports:
 *   - `@stackra/ts-pagination` → core paginators + value objects
 *   - `@stackra/ts-pagination/nestjs` → NestJS module + middleware
 *   - `@stackra/ts-pagination/react` → React hooks
 */

export {
  PaginationModule,
  PAGINATION_CONFIG,
  DEFAULT_CONFIG,
  AbstractPaginator,
  LengthAwarePaginator,
  SimplePaginator,
  CursorPaginator,
  Cursor,
  defineConfig,
} from './core';
export type { IPaginationContext } from './core';
