/**
 * @file api-response-envelope.interface.ts
 * @module @stackra/swagger/src/interfaces
 * @description IApiResponseEnvelope interface.
 */

/**
 * Standard API response envelope.
 */
export interface IApiResponseEnvelope<T = any> {
  /** Response payload. */
  data: T;
  /** HTTP status code. */
  statusCode: number;
  /** ISO timestamp of the response. */
  timestamp: string;
  /** Request path. */
  path: string;
  /** Pagination metadata (present only for paginated responses). */
  meta?: Record<string, any>;
  /** Navigation links (present only for paginated responses). */
  links?: Record<string, string | null>;
}
