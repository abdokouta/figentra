/**
 * @file api-paginated.decorator.ts
 * @module @stackra/nestjs-orm/http/decorators
 * @description Method decorator that marks an endpoint as paginated.
 *   Adds standard `page` and `limit` query parameters via metadata.
 *   Useful for Swagger/OpenAPI documentation generation.
 */

import { SetMetadata, applyDecorators } from '@nestjs/common';

// ============================================================================
// Constants
// ============================================================================

/** Metadata key for paginated endpoint marker. */
export const API_PAGINATED_KEY = 'stackra:orm:http:paginated';

// ============================================================================
// Decorator
// ============================================================================

/**
 * Mark a controller method as returning a paginated response.
 *
 * Stores metadata used by Swagger plugins and response interceptors
 * to document standard pagination query parameters.
 *
 * @returns Method decorator.
 */
export function ApiPaginated(): MethodDecorator {
  return applyDecorators(SetMetadata(API_PAGINATED_KEY, true));
}
