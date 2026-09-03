/**
 * @file pagination-response.interceptor.ts
 * @module @stackra/ts-pagination/nestjs/interceptors
 * @description NestJS interceptor that wraps paginator instances into
 *   the standard pagination envelope format for API responses.
 */

import {
  IInjectable,
  type NestInterceptor,
  type ExecutionContext,
  type CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';

import { AbstractPaginator } from '../../core/paginators/abstract.paginator';
import { CursorPaginator } from '../../core/paginators/cursor.paginator';
import { PAGINATED_METADATA_KEY } from '../decorators/paginated.decorator';

// ════════════════════════════════════════════════════════════════════════════════
// Interceptor
// ════════════════════════════════════════════════════════════════════════════════

/**
 * NestJS interceptor that serializes paginator instances into envelope format.
 *
 * When a controller method decorated with `@Paginated()` returns a paginator
 * instance (LengthAwarePaginator, SimplePaginator, or CursorPaginator), this
 * interceptor automatically calls `toArray()` to serialize it into the standard
 * Laravel-compatible pagination envelope.
 *
 * If the return value is not a paginator instance, it passes through unchanged.
 *
 * @example
 * ```typescript
 * // In your module
 * providers: [
 *   { provide: APP_INTERCEPTOR, useClass: PaginationResponseInterceptor },
 * ]
 * ```
 */
@IInjectable()
export class PaginationResponseInterceptor implements NestInterceptor {
  /**
   * @param reflector - NestJS reflector for reading decorator metadata
   */
  public constructor(private readonly reflector: Reflector) {}

  /**
   * Intercept the response and serialize paginator instances.
   *
   * @param context - Execution context
   * @param next - Call handler for the next interceptor/handler
   * @returns Observable that may transform paginator instances into plain objects
   */
  public intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const isPaginated = this.reflector.get<unknown>(PAGINATED_METADATA_KEY, context.getHandler());

    if (!isPaginated) {
      return next.handle();
    }

    return next.handle().pipe(
      map((data: unknown) => {
        if (data instanceof AbstractPaginator) {
          return data.toArray();
        }

        if (data instanceof CursorPaginator) {
          return data.toArray();
        }

        return data;
      })
    );
  }
}
