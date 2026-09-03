/**
 * @file mutation-response.type.ts
 * @module @stackra/nestjs-response/graphql/types
 * @description Generic mutation response type for GraphQL mutations.
 *   Provides a consistent shape for all mutation results with success status,
 *   message, data, and error details.
 */

import type { IErrorDetail } from '../../interfaces/error-detail.interface';

/**
 * Generic mutation response type for GraphQL.
 *
 * Wraps mutation results in a consistent shape that includes
 * success status, optional message, the mutation result data,
 * and any error details.
 *
 * @typeParam T - The type of the mutation result data
 */
export interface IMutationResponse<T = unknown> {
  /** Whether the mutation completed successfully. */
  success: boolean;
  /** Optional human-readable message about the result. */
  message?: string;
  /** The mutation result data (present on success). */
  data?: T;
  /** Structured error details (present on failure). */
  errors?: IErrorDetail[];
}
