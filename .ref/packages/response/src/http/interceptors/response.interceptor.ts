/**
 * @file response.interceptor.ts
 * @module @stackra/nestjs-response/http/interceptors
 * @description Global NestJS interceptor that wraps controller return values
 *   in the standard response envelope. Respects @SkipEnvelope() and @ResponsePreset()
 *   decorator metadata for per-route customization.
 */

import {
  IInjectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { randomUUID } from 'crypto';
import { Observable, map } from 'rxjs';
import type { IResponseEnvelope } from '../../interfaces/response-envelope.interface';
import type { IResponseModuleConfig } from '../../interfaces/response-config.interface';
import type { IResponsePreset } from '../../presets';
import { RESPONSE_CONFIG } from '../../constants';
import { ResponsePipeline } from '../../pipeline/response-pipeline.service';

// ============================================================================
// Metadata Keys
// ============================================================================

/** Metadata key for the skip envelope decorator. */
const SKIP_ENVELOPE_KEY = 'response:skip_envelope';

/** Metadata key for the use preset decorator. */
const USE_PRESET_KEY = 'response:use_preset';

// ============================================================================
// Interceptor
// ============================================================================

/**
 * Global interceptor that wraps controller responses in the standard envelope.
 *
 * Behavior:
 * - Checks for `@SkipEnvelope()` metadata to bypass wrapping
 * - Wraps controller return values in `IResponseEnvelope`
 * - Adds timestamp and request_id from `ResponseContext`
 * - Applies preset if `@ResponsePreset()` is set on the handler
 * - Sets appropriate HTTP status code from the response
 */
@IInjectable()
export class ResponseInterceptor implements NestInterceptor {
  /**
   * @param config - Module configuration
   * @param reflector - NestJS reflector for reading metadata
   * @param pipeline - Response transformation pipeline
   * @param context - Request-scoped response context
   */
  public constructor(
    @Inject(RESPONSE_CONFIG) private readonly config: IResponseModuleConfig,
    private readonly reflector: Reflector,
    private readonly pipeline: ResponsePipeline
  ) {}

  /**
   * Intercept the response and wrap it in the standard envelope.
   *
   * @param executionContext - The NestJS execution context
   * @param next - The next handler in the chain
   * @returns Observable of the wrapped response
   */
  public intercept(executionContext: ExecutionContext, next: CallHandler): Observable<unknown> {
    const shouldSkip = this.reflector.getAllAndOverride<boolean>(SKIP_ENVELOPE_KEY, [
      executionContext.getHandler(),
      executionContext.getClass(),
    ]);

    if (shouldSkip || !this.config.envelope?.enabled) {
      return next.handle();
    }

    const preset = this.reflector.getAllAndOverride<IResponsePreset | undefined>(USE_PRESET_KEY, [
      executionContext.getHandler(),
      executionContext.getClass(),
    ]);

    return next.handle().pipe(
      map((data) => {
        // If data is already an envelope, pass through
        if (this.isEnvelope(data)) {
          return data;
        }

        // If data is from ResponseBuilder.build() — has { envelope, status, headers }
        if (this.isBuilderResult(data)) {
          const response = executionContext.switchToHttp().getResponse();
          if (data.status) {
            response.status(data.status);
          }
          if (data.headers) {
            for (const [key, value] of Object.entries(data.headers)) {
              response.setHeader(key, value);
            }
          }
          // Add request context to the pre-built envelope
          if (this.config.envelope?.includeRequestId) {
            data.envelope.request_id = randomUUID();
          }
          return data.envelope;
        }

        // If data is a paginated result (has items + meta from @stackra/nestjs-pagination)
        if (this.isPaginatedResult(data)) {
          let envelope: IResponseEnvelope = {
            success: true,
            data: data.items,
            meta: data.meta as Record<string, unknown>,
            links: data.links as Record<string, string | null> | undefined,
            timestamp: new Date().toISOString(),
          };

          if (this.config.envelope?.includeRequestId) {
            envelope.request_id = randomUUID();
          }

          if (preset?.transformers && preset.transformers.length > 0) {
            const instances = preset.transformers.map((Ctor) => new Ctor());
            envelope = this.pipeline.transform(envelope, instances);
          }

          return envelope;
        }

        // Default: wrap plain value in standard envelope
        let envelope: IResponseEnvelope = {
          success: true,
          data,
          timestamp: new Date().toISOString(),
        };

        // Add request context data
        if (this.config.envelope?.includeRequestId) {
          envelope.request_id = randomUUID();
        }

        // Apply preset transformers (instantiate class references)
        if (preset?.transformers && preset.transformers.length > 0) {
          const instances = preset.transformers.map((Ctor) => new Ctor());
          envelope = this.pipeline.transform(envelope, instances);
        }

        // Apply transport hints (HTTP-specific: headers via hints.headers)
        if (preset?.hints) {
          const headers = preset.hints['headers'] as Record<string, string> | undefined;
          if (headers) {
            const response = executionContext.switchToHttp().getResponse();
            for (const [key, value] of Object.entries(headers)) {
              response.setHeader(key, value);
            }
          }
        }

        return envelope;
      })
    );
  }

  /**
   * Check if a value is already a response envelope.
   *
   * @param value - The value to check
   * @returns Whether the value matches the envelope shape
   */
  private isEnvelope(value: unknown): value is IResponseEnvelope {
    if (typeof value !== 'object' || value === null) {
      return false;
    }
    const obj = value as Record<string, unknown>;
    return 'success' in obj && 'data' in obj && 'timestamp' in obj;
  }

  /**
   * Check if a value is a ResponseBuilder.build() result.
   *
   * ResponseBuilder.build() returns `{ envelope, status, headers }` where
   * `envelope` is an `IResponseEnvelope`.
   *
   * @param value - The value to check
   * @returns Whether the value is a builder result
   */
  private isBuilderResult(value: unknown): value is {
    envelope: IResponseEnvelope;
    status: number;
    headers: Record<string, string>;
  } {
    if (typeof value !== 'object' || value === null) {
      return false;
    }
    const obj = value as Record<string, unknown>;
    return (
      'envelope' in obj &&
      'status' in obj &&
      typeof obj.envelope === 'object' &&
      obj.envelope !== null
    );
  }

  /**
   * Check if a value is a paginated result from `@stackra/nestjs-pagination`.
   *
   * Paginated results have the shape `{ items: T[], meta, links }`.
   *
   * @param value - The value to check
   * @returns Whether the value matches the paginated result shape
   */
  private isPaginatedResult(value: unknown): value is {
    items: unknown[];
    meta: unknown;
    links?: unknown;
  } {
    if (typeof value !== 'object' || value === null) {
      return false;
    }
    const obj = value as Record<string, unknown>;
    return 'items' in obj && Array.isArray(obj.items) && 'meta' in obj;
  }
}
