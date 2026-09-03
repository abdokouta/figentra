/**
 * @file paginated.decorator.ts
 * @module @stackra/ts-pagination/nestjs/decorators
 * @description Endpoint decorator that marks a route as paginated.
 *   Stores metadata indicating the endpoint returns paginated data,
 *   which the pagination response interceptor can use for envelope wrapping.
 */

import { SetMetadata } from '@nestjs/common';

// ════════════════════════════════════════════════════════════════════════════════
// Constants
// ════════════════════════════════════════════════════════════════════════════════

/** Metadata key for the @Paginated() decorator. */
export const PAGINATED_METADATA_KEY = 'stackra:pagination:paginated';

// ════════════════════════════════════════════════════════════════════════════════
// Options
// ════════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════════════
// Decorator
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Mark a controller method as returning paginated results.
 *
 * When applied, the pagination response interceptor will wrap the method's
 * return value in the standard pagination envelope format.
 *
 * @param options - Optional per-endpoint pagination overrides
 * @returns Method decorator
 *
 * @example
 * ```typescript
 * @Paginated({ defaultPerPage: 25 })
 * @Get('users')
 * async listUsers(): Promise<LengthAwarePaginator<User>> {
 *   return this.userService.paginate();
 * }
 * ```
 */
export function Paginated(options: IPaginatedOptions = {}): MethodDecorator {
  return SetMetadata(PAGINATED_METADATA_KEY, options);
}
