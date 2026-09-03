/**
 * @file response-envelope.interface.ts
 * @module @stackra/nestjs-response/interfaces
 * @description Standard response envelope interface for all API responses.
 *   Defines the unified shape that wraps every successful and error response.
 */

import type { IErrorDetail } from './error-detail.interface';

/**
 * Standard response envelope for all API responses.
 *
 * Every HTTP and GraphQL response is wrapped in this shape when
 * envelope mode is enabled. Provides consistent structure for
 * clients to parse regardless of the endpoint.
 */
export interface IResponseEnvelope<T = unknown> {
  /** Whether the operation completed successfully. */
  success: boolean;
  /** Optional human-readable message describing the result. */
  message?: string;
  /** The response payload data. */
  data: T;
  /** Additional metadata (pagination info, timing, counts). */
  meta?: Record<string, unknown>;
  /** HATEOAS links for resource navigation. */
  links?: Record<string, string | null>;
  /** Structured error details (present on failure). */
  errors?: IErrorDetail[];
  /** Debug information (only in debug mode). */
  debug?: Record<string, unknown>;
  /** ISO 8601 timestamp of when the response was generated. */
  timestamp: string;
  /** Unique request identifier for tracing. */
  request_id?: string;
}
