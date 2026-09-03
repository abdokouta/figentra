/**
 * @file api-filterable.decorator.ts
 * @module @stackra/nestjs-orm/http/decorators
 * @description Method decorator that marks an endpoint as accepting filter params.
 *   Stores filterable field metadata for Swagger/OpenAPI documentation.
 */

import { SetMetadata } from '@nestjs/common';

// ============================================================================
// Constants
// ============================================================================

/** Metadata key for filterable endpoint marker. */
export const API_FILTERABLE_KEY = 'stackra:orm:http:filterable';

// ============================================================================
// Decorator
// ============================================================================

/**
 * Mark a controller method as supporting filter query parameters.
 *
 * @param fields - Array of field names that support filtering.
 * @returns Method decorator.
 */
export function ApiFilterable(fields?: string[]): MethodDecorator {
  return SetMetadata(API_FILTERABLE_KEY, fields ?? []);
}
