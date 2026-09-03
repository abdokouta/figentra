/**
 * @file webhook-response.interceptor.ts
 * @module @stackra/nestjs-webhook/http
 * @description Interceptor that applies the WEBHOOK_PRESET to outbound webhook
 *   delivery responses. Ensures webhook payloads are flat (no envelope wrapping)
 *   per the transport-agnostic preset system.
 */

import { IInjectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { WEBHOOK_PRESET } from '@stackra/nestjs-response';
import type { IResponsePreset } from '@stackra/nestjs-response';

// ============================================================================
// Interceptor
// ============================================================================

/**
 * WebhookResponseInterceptor — applies WEBHOOK_PRESET to webhook deliveries.
 *
 * When applied to a controller or handler, ensures the response payload
 * is flat (no envelope wrapping), nulls are stripped, and no meta/links/debug
 * are included — per the WEBHOOK_PRESET configuration.
 *
 * @example
 * ```typescript
 * @UseInterceptors(WebhookResponseInterceptor)
 * @Post('deliver')
 * async deliver(@Body() payload: any) { ... }
 * ```
 */
@IInjectable()
export class WebhookResponseInterceptor implements NestInterceptor {
  /** The active preset for webhook responses. */
  private readonly preset: IResponsePreset = WEBHOOK_PRESET;

  /**
   * Intercept the response and apply webhook preset shaping.
   *
   * @param context - Execution context
   * @param next - Call handler for the next interceptor/handler
   * @returns Observable of the shaped response
   */
  public intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((data: unknown) => {
        // If the preset says skip envelope, return raw data
        if (this.preset.hints?.skipEnvelope) {
          return this.applyShaping(data);
        }
        return data;
      })
    );
  }

  /**
   * Apply preset shaping rules to the payload.
   *
   * @param data - The raw response data
   * @returns Shaped data per preset rules
   */
  private applyShaping(data: unknown): unknown {
    if (data === null || data === undefined) return data;
    if (typeof data !== 'object') return data;

    let result = data as Record<string, unknown>;

    // Strip nulls if preset requires
    if (this.preset.stripNulls) {
      result = this.removeNulls(result);
    }

    // Flatten single item if preset requires
    if (this.preset.flattenSingleItem && 'data' in result) {
      const inner = result['data'];
      if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
        return inner;
      }
    }

    return result;
  }

  /**
   * Recursively remove null and undefined values from an object.
   *
   * @param obj - Object to clean
   * @returns Object with nulls removed
   */
  private removeNulls(obj: Record<string, unknown>): Record<string, unknown> {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) continue;
      if (typeof value === 'object' && !Array.isArray(value)) {
        cleaned[key] = this.removeNulls(value as Record<string, unknown>);
      } else {
        cleaned[key] = value;
      }
    }
    return cleaned;
  }
}
