/**
 * @file pagination-params.decorator.ts
 * @module @stackra/ts-pagination/nestjs/decorators
 * @description Parameter decorators for injecting pagination context into
 *   controller method parameters. Reads from AsyncLocalStorage populated
 *   by the PaginationResolverMiddleware.
 */

import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import {
  getCurrentPagination,
  getCurrentPage,
  getCurrentPerPage,
  getCurrentCursor,
} from '../../core/value-objects/pagination-state';
import type { IPaginationContext } from '../../core/value-objects/pagination-state';
import type { Cursor } from '../../core/value-objects/cursor';

// ════════════════════════════════════════════════════════════════════════════════
// Full Context Decorator
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Inject the full pagination context from the current request.
 *
 * Reads from AsyncLocalStorage populated by PaginationResolverMiddleware.
 * Contains page, perPage, cursor, sort, and order — all validated and capped.
 *
 * @returns The full IPaginationContext for the current request
 *
 * @example
 * ```typescript
 * @Get('users')
 * async list(@PaginationContext() ctx: IPaginationContext) {
 *   return this.userService.paginate(ctx.page, ctx.perPage);
 * }
 * ```
 */
export const PaginationContext = createParamDecorator(
  (_data: unknown, _ctx: ExecutionContext): IPaginationContext => {
    return getCurrentPagination() ?? { page: 1, perPage: 15, cursor: null };
  }
);

// ════════════════════════════════════════════════════════════════════════════════
// Granular Param Decorators
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Inject the current page number from the request's pagination context.
 *
 * @returns Current page number (1-indexed, minimum 1)
 *
 * @example
 * ```typescript
 * @Get('users')
 * async list(@Page() page: number, @PerPage() perPage: number) {
 *   return this.userService.paginate(page, perPage);
 * }
 * ```
 */
export const Page = createParamDecorator((_data: unknown, _ctx: ExecutionContext): number => {
  return getCurrentPage();
});

/**
 * Inject the current per-page count from the request's pagination context.
 *
 * Already validated and capped by the middleware to the configured maxPerPage.
 *
 * @returns Current per-page count
 *
 * @example
 * ```typescript
 * @Get('products')
 * async list(@PerPage() perPage: number) {
 *   return this.productService.findAll({ limit: perPage });
 * }
 * ```
 */
export const PerPage = createParamDecorator((_data: unknown, _ctx: ExecutionContext): number => {
  return getCurrentPerPage();
});

/**
 * Inject the current cursor from the request's pagination context.
 *
 * Returns null if no cursor parameter is present in the request
 * (i.e., this is the first page of cursor-based pagination).
 *
 * @returns Decoded Cursor instance, or null
 *
 * @example
 * ```typescript
 * @Get('messages')
 * async list(@CursorParam() cursor: Cursor | null) {
 *   return this.messageService.findAfterCursor(cursor);
 * }
 * ```
 */
export const CursorParam = createParamDecorator(
  (_data: unknown, _ctx: ExecutionContext): Cursor | null => {
    return getCurrentCursor();
  }
);
