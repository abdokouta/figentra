/**
 * @file request-context.interface.ts
 * @module @stackra/logger/src/interfaces
 * @description IRequestContext interface.
 */

/**
 * Request context data stored in AsyncLocalStorage.
 */
export interface IRequestContext {
  /** Unique request identifier. */
  requestId: string;
  /** W3C Trace ID. */
  traceId: string;
  /** W3C Span ID. */
  spanId: string;
  /** Parent Span ID (for child spans). */
  parentSpanId?: string;
  /** Correlation ID for distributed tracing. */
  correlationId?: string;
  /** HTTP method. */
  method?: string;
  /** Request URL path. */
  url?: string;
  /** Client IP address. */
  ip?: string;
  /** User agent string. */
  userAgent?: string;
  /** Authenticated user ID. */
  userId?: string;
  /** Tenant/scope ID. */
  tenantId?: string;
}
