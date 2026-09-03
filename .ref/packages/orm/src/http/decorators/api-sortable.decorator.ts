/**
 * @file api-sortable.decorator.ts
 * @module @stackra/nestjs-orm/http/decorators
 * @description Method decorator that marks an endpoint as accepting sort params.
 *   Stores sortable field metadata for Swagger/OpenAPI documentation.
 */

import { SetMetadata } from '@nestjs/common';

// ============================================================================
// Constants
// ============================================================================

/** Metadata key for sortable endpoint marker. */
export const API_SORTABLE_KEY = 'stackra:orm:http:sortable';

// ============================================================================
// Decorator
// ============================================================================

/**
 * Mark a controller method as supporting sort query parameters.
 *
 * @param fields - Array of field names that support sorting.
 * @returns Method decorator.
 */
export function ApiSortable(fields?: string[]): MethodDecorator {
  return SetMetadata(API_SORTABLE_KEY, fields ?? []);
}
