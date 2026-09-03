/**
 * @file request-context.middleware.ts
 * @module @stackra/logger/nestjs/middleware
 * @description AsyncLocalStorage-based request context middleware.
 *   Creates a per-request store with requestId, traceId, spanId, parentSpanId,
 *   and correlationId for automatic injection into log entries throughout the
 *   request lifecycle. Supports W3C Trace Context (traceparent header) and
 *   X-Correlation-Id for distributed tracing.
 *
 *   Also initializes the AsyncContextRepository's per-request store so that
 *   any `repo.add()` calls during the request are isolated to that request.
 */

import { Injectable, Inject, Optional } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { randomUUID } from 'crypto';
import type { NestMiddleware } from '@nestjs/common';

import { AsyncContextRepository } from '../services/async-context-repository.service';
import { requestContextStorage, type IRequestContext } from '../shared/request-context-storage';

// Re-export for barrel consumers
export {
  requestContextStorage,
  getRequestContext,
  type IRequestContext,
} from '../shared/request-context-storage';

/**
 * NestJS middleware that creates a per-request context in AsyncLocalStorage.
 *
 * For every incoming request:
 * 1. Parses `traceparent` header (W3C Trace Context format: `00-{traceId}-{spanId}-{flags}`)
 * 2. Extracts `X-Correlation-Id` header for business correlation
 * 3. Extracts or generates a requestId (from `X-Request-Id` header)
 * 4. Records the start time for duration measurement
 * 5. Stores all in AsyncLocalStorage for downstream access
 * 6. Initializes the AsyncContextRepository's per-request isolated store
 *
 * The ContextEnricher reads from the AsyncContextRepository which automatically
 * injects requestId, traceId, correlationId, and spanId into every log entry
 * emitted within the request scope.
 *
 * @example
 * ```typescript
 * // Applied automatically by NestLoggerModule when requestLogging is enabled
 * consumer.apply(RequestContextMiddleware).forRoutes('*');
 *
 * // Traceparent header format: version-traceId-spanId-flags
 * // Example: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
 * ```
 */
@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  /**
   * @param asyncContextRepo - AsyncContextRepository for per-request store initialization
   */
  public constructor(
    @Optional()
    @Inject(AsyncContextRepository)
    private readonly asyncContextRepo?: AsyncContextRepository
  ) {}

  /**
   * Create request context and run the remainder of the request in that context.
   * Sets up both the request propagation store (IRequestContext) and the
   * AsyncContextRepository's per-request isolation.
   *
   * @param req - HTTP request object
   * @param _res - HTTP response object (unused)
   * @param next - Next middleware function
   */
  public use(req: any, _res: any, next: () => void): void {
    const requestId = (req.headers?.['x-request-id'] as string) ?? randomUUID();

    // Parse W3C traceparent header: 00-{traceId}-{spanId}-{flags}
    const traceparent = req.headers?.['traceparent'] as string | undefined;
    const traceContext = this.parseTraceparent(traceparent);

    // Extract correlation ID from header or fall back to requestId
    const correlationId = (req.headers?.['x-correlation-id'] as string) ?? requestId;

    const context: IRequestContext = {
      requestId,
      traceId: traceContext?.traceId ?? requestId,
      spanId: traceContext?.spanId,
      parentSpanId: traceContext?.spanId,
      correlationId,
      traceFlags: traceContext?.flags,
      startTime: performance.now(),
    };

    // Run inside request propagation AsyncLocalStorage
    requestContextStorage.run(context, () => {
      // Also run inside the AsyncContextRepository's isolated store
      if (this.asyncContextRepo) {
        this.asyncContextRepo.runInContext(() => {
          next();
        });
      } else {
        next();
      }
    });
  }

  /**
   * Parse a W3C traceparent header into its component parts.
   * Format: `{version}-{traceId}-{spanId}-{flags}`
   * Example: `00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01`
   *
   * @param header - Raw traceparent header value
   * @returns Parsed trace context or undefined if invalid/missing
   */
  private parseTraceparent(
    header: string | undefined
  ): { traceId: string; spanId: string; flags: string } | undefined {
    if (!header) return undefined;

    const parts = header.split('-');
    if (parts.length !== 4) return undefined;

    const [_version, traceId, spanId, flags] = parts;

    // Validate trace ID (32 hex chars) and span ID (16 hex chars)
    if (!traceId || traceId.length !== 32) return undefined;
    if (!spanId || spanId.length !== 16) return undefined;

    return { traceId, spanId, flags: flags ?? '00' };
  }
}
