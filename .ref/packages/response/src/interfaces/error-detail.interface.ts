/**
 * @file error-detail.interface.ts
 * @module @stackra/nestjs-response/interfaces
 * @description Structured error detail interface for API error responses.
 *   Provides a consistent shape for field-level and domain-level errors.
 */

/**
 * Structured error detail for API responses.
 *
 * Used in both HTTP and GraphQL error envelopes to provide
 * machine-readable error information with optional field association.
 */
export interface IErrorDetail {
  /** Machine-readable error code (e.g., 'VALIDATION_FAILED', 'NOT_FOUND'). */
  code: string;
  /** Human-readable error message. */
  message: string;
  /** Field path this error relates to (for validation errors). */
  field?: string;
  /** Additional metadata about the error. */
  meta?: Record<string, unknown>;
}
