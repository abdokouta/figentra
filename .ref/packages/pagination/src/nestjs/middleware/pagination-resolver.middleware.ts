/**
 * @file pagination-resolver.middleware.ts
 * @module @stackra/ts-pagination/nestjs/middleware
 * @description NestJS middleware that resolves pagination parameters from
 *   incoming request query params and stores them in AsyncLocalStorage.
 *   Supports both offset-based (page/per_page) and cursor-based pagination.
 */

import { IInjectable, Inject, type NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

import { paginationStorage } from '../../core/value-objects/pagination-state';
import type { IPaginationContext } from '../../core/value-objects/pagination-state';
import { Cursor } from '../../core/value-objects/cursor';
import type { IPaginationModuleConfig } from '../../core/pagination.module';
import { PAGINATION_CONFIG } from '@stackra/contracts';

// ════════════════════════════════════════════════════════════════════════════════
// Middleware
// ════════════════════════════════════════════════════════════════════════════════

/**
 * NestJS middleware for automatic pagination parameter resolution.
 *
 * Reads `page`, `per_page` (or `perPage`), `cursor`, `sort`, and `order`
 * from the request query parameters, validates and caps them according to
 * the module configuration, and stores the result in AsyncLocalStorage.
 *
 * After this middleware runs, any code in the request call stack can access
 * pagination parameters via `getCurrentPage()`, `getCurrentPerPage()`, etc.
 *
 * Features:
 * - Supports both `per_page` and `perPage` query parameter names
 * - Caps per_page to the configured maximum (default 100)
 * - Validates page number is a positive integer
 * - Decodes cursor from URL-safe base64
 * - Validates sort order is 'asc' or 'desc'
 */
@IInjectable()
export class PaginationResolverMiddleware implements NestMiddleware {
  /**
   * @param config - Pagination module configuration
   */
  public constructor(
    @Inject(PAGINATION_CONFIG)
    private readonly config: Required<IPaginationModuleConfig>
  ) {}

  /**
   * Process the incoming request and store pagination context.
   *
   * @param req - Express request object
   * @param _res - Express response object (unused)
   * @param next - Next middleware function
   */
  public use(req: Request, _res: Response, next: NextFunction): void {
    const query = req.query as Record<string, string | undefined>;

    const page = this.resolvePageNumber(query);
    const perPage = this.resolvePerPage(query);
    const cursor = this.resolveCursor(query);
    const sort = query['sort'] || undefined;
    const order = this.resolveOrder(query);

    const context: IPaginationContext = {
      page,
      perPage,
      cursor,
      sort,
      order,
    };

    paginationStorage.run(context, () => {
      next();
    });
  }

  /**
   * Resolve and validate the page number from query parameters.
   *
   * @param query - Request query parameters
   * @returns Valid page number (minimum 1)
   */
  private resolvePageNumber(query: Record<string, string | undefined>): number {
    const raw = query[this.config.pageParam];
    const page = raw ? parseInt(raw, 10) : 1;

    return Number.isNaN(page) || page < 1 ? 1 : page;
  }

  /**
   * Resolve and validate the per-page count from query parameters.
   *
   * Supports both configured param name (default `per_page`) and camelCase
   * variant `perPage` for flexibility.
   *
   * @param query - Request query parameters
   * @returns Valid per-page count (capped to maxPerPage)
   */
  private resolvePerPage(query: Record<string, string | undefined>): number {
    const raw = query[this.config.perPageParam] ?? query['perPage'];
    const perPage = raw ? parseInt(raw, 10) : this.config.defaultPerPage;

    if (Number.isNaN(perPage) || perPage < 1) {
      return this.config.defaultPerPage;
    }

    return Math.min(perPage, this.config.maxPerPage);
  }

  /**
   * Resolve and decode the cursor from query parameters.
   *
   * @param query - Request query parameters
   * @returns Decoded Cursor instance, or null if not present or invalid
   */
  private resolveCursor(query: Record<string, string | undefined>): Cursor | null {
    const raw = query[this.config.cursorParam];
    return Cursor.fromEncoded(raw ?? null);
  }

  /**
   * Resolve and validate the sort order from query parameters.
   *
   * @param query - Request query parameters
   * @returns Valid sort order, or undefined if not specified
   */
  private resolveOrder(query: Record<string, string | undefined>): 'asc' | 'desc' | undefined {
    const raw = query['order']?.toLowerCase();

    if (raw === 'asc' || raw === 'desc') {
      return raw;
    }

    return undefined;
  }
}
