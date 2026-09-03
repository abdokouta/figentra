/**
 * @file graphql-response.interceptor.ts
 * @module @stackra/nestjs-response/graphql/interceptors
 * @description NestJS interceptor for GraphQL that wraps mutation results
 *   in the standard MutationResponse format with success, message, data, and errors.
 */

import { IInjectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, map, catchError, of } from 'rxjs';
import type { IMutationResponse } from '../types/mutation-response.type';

/**
 * Interceptor that wraps GraphQL mutation results in MutationResponse format.
 *
 * Automatically wraps successful mutation results with `{ success: true, data }`
 * and catches errors to return `{ success: false, errors }` instead of throwing.
 * Only applies to GraphQL execution contexts.
 */
@IInjectable()
export class GraphqlResponseInterceptor implements NestInterceptor {
  /**
   * Intercept GraphQL responses and wrap mutations in MutationResponse format.
   *
   * @param context - The NestJS execution context
   * @param next - The next handler in the chain
   * @returns Observable of the wrapped mutation response
   */
  public intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    // Only apply to GraphQL contexts
    const contextType = context.getType<string>();
    if (contextType !== 'graphql') {
      return next.handle();
    }

    return next.handle().pipe(
      map((data): IMutationResponse => {
        // If already in MutationResponse format, pass through
        if (this.isMutationResponse(data)) {
          return data;
        }

        return {
          success: true,
          data,
        };
      }),
      catchError((error: Error) => {
        const response: IMutationResponse<null> = {
          success: false,
          message: error.message,
          errors: [
            {
              code: this.extractCode(error),
              message: error.message,
            },
          ],
        };

        return of(response);
      })
    );
  }

  /**
   * Check if a value is already in MutationResponse format.
   *
   * @param value - The value to check
   * @returns Whether the value matches the MutationResponse shape
   */
  private isMutationResponse(value: unknown): value is IMutationResponse {
    if (typeof value !== 'object' || value === null) {
      return false;
    }
    return 'success' in (value as Record<string, unknown>);
  }

  /**
   * Extract an error code from an error instance.
   *
   * @param error - The error to extract a code from
   * @returns A machine-readable error code
   */
  private extractCode(error: Error): string {
    if ('code' in error && typeof (error as Record<string, unknown>)['code'] === 'string') {
      return (error as Record<string, unknown>)['code'] as string;
    }
    return 'INTERNAL_ERROR';
  }
}
