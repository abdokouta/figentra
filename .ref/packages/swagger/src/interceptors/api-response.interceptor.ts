/**
 * @file api-response.interceptor.ts
 * @module @stackra/nestjs-swagger/interceptors
 * @description Global interceptor that wraps all responses in a standardized envelope.
 *   Ensures consistent response format across all REST endpoints.
 *
 *   ## Response Envelope
 *   ```json
 *   {
 *     "data": { ... },
 *     "statusCode": 200,
 *     "timestamp": "2026-06-05T12:00:00.000Z",
 *     "path": "/api/products/abc-123"
 *   }
 *   ```
 *
 *   ## Paginated Response (detected via `meta` property)
 *   ```json
 *   {
 *     "data": [...],
 *     "meta": { "total": 50, "page": 1, "limit": 20, ... },
 *     "links": { "self": "...", "next": "...", ... },
 *     "statusCode": 200,
 *     "timestamp": "2026-06-05T12:00:00.000Z",
 *     "path": "/api/products"
 *   }
 *   ```
 */

import {
  CallHandler,
  ExecutionContext,
  IInjectable,
  NestInterceptor,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// ============================================================================
// Types
// ============================================================================

// ============================================================================
// Interceptor
// ============================================================================

/**
 * Wraps all HTTP responses in a standardized envelope format.
 *
 * Automatically detects paginated responses (objects with `data` + `meta` keys)
 * and preserves their structure while adding envelope fields.
 *
 * Auto-registered globally via `APP_INTERCEPTOR` in `NestSwaggerModule.forRoot()`.
 *
 * Or per-controller/method:
 * ```typescript
 * @UseInterceptors(ApiResponseInterceptor)
 * ```
 */
@IInjectable()
export class ApiResponseInterceptor implements NestInterceptor {
  /**
   * Intercept the response and wrap in the standard envelope.
   *
   * @param context - Execution context.
   * @param next - Call handler for the route.
   * @returns Observable with the wrapped response.
   */
  public intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map((responseData) => {
        const statusCode = response.statusCode ?? HttpStatus.OK;
        const timestamp = new Date().toISOString();
        const path = request.url;

        // Already wrapped (e.g., from formatPaginatedResponse or formatEntityResponse)
        if (responseData && typeof responseData === 'object' && 'statusCode' in responseData) {
          return {
            ...responseData,
            timestamp,
            path,
          };
        }

        // Paginated response detection (has data + meta)
        if (
          responseData &&
          typeof responseData === 'object' &&
          'data' in responseData &&
          'meta' in responseData
        ) {
          return {
            data: responseData.data,
            meta: responseData.meta,
            links: responseData.links ?? undefined,
            statusCode,
            timestamp,
            path,
          };
        }

        // Standard single-entity or array response
        return {
          data: responseData,
          statusCode,
          timestamp,
          path,
        };
      })
    );
  }
}
