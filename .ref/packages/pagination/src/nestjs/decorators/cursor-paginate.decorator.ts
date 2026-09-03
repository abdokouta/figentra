/**
 * @file cursor-paginate.decorator.ts
 * @module @stackra/pagination/nestjs/decorators
 * @description Parameter decorator for extracting cursor-based pagination params
 *   from HTTP query parameters (Relay-style: first, after, last, before).
 */

import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

// ============================================================================
// Types
// ============================================================================

// ============================================================================
// Decorator
// ============================================================================

/**
 * Extract cursor-based pagination parameters from the request.
 *
 * Parses `first`, `after`, `last`, and `before` from query parameters
 * and returns a typed `ICursorParams` object following the Relay specification.
 *
 * @returns Parameter decorator
 *
 * @example
 * ```typescript
 * @Get('messages')
 * async list(@CursorPaginate() params: ICursorParams) {
 *   return this.messageService.paginateCursor(params.first ?? 20, params.after);
 * }
 * ```
 */
export const CursorPaginate = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): ICursorParams => {
    const request = ctx.switchToHttp().getRequest<{
      query: Record<string, string | undefined>;
    }>();
    const query = request.query;

    return {
      first: query.first ? parseInt(query.first, 10) || undefined : undefined,
      after: query.after ?? undefined,
      last: query.last ? parseInt(query.last, 10) || undefined : undefined,
      before: query.before ?? undefined,
    };
  }
);
