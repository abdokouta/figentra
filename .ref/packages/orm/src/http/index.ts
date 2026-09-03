/**
 * @file index.ts
 * @module @stackra/nestjs-orm/http
 * @description HTTP/REST layer for the ORM package.
 *   Provides controller generation, REST response formatting, pagination
 *   helpers, and request-scoped EntityManager for HTTP contexts.
 *
 *   Import from `@stackra/nestjs-orm/http` to access these features.
 *   This subpath requires `@nestjs/common` for controller/route decorators.
 */

// ============================================================================
// Controller Factory
// ============================================================================

export { defineController } from './generators/crud-controller.factory';
export type {
  DefineControllerOptions,
  ControllerActions,
} from './generators/crud-controller.factory';

// ============================================================================
// Response Formatting
// ============================================================================

export { formatPaginatedResponse } from './utils/format-paginated-response.util';
export { formatEntityResponse } from './utils/format-entity-response.util';
export type { PaginatedResponse, EntityResponse, PaginationLinks } from './interfaces/response.interface';

// ============================================================================
// Decorators
// ============================================================================

export { ApiPaginated } from './decorators/api-paginated.decorator';
export { ApiFilterable } from './decorators/api-filterable.decorator';
export { ApiSortable } from './decorators/api-sortable.decorator';

// ============================================================================
// Pagination Query Parsing
// ============================================================================

export { parsePaginationQuery } from './utils/parse-pagination-query.util';
export { parseFilterQuery } from './utils/parse-filter-query.util';
export { parseSortQuery } from './utils/parse-sort-query.util';
export type { PaginationQuery, ParsedPagination } from './interfaces/pagination-query.interface';

// ============================================================================
// Validation Pipes
// ============================================================================

export { ZodValidationPipe } from './pipes/zod-validation.pipe';

// ============================================================================
// Zod to OpenAPI
// ============================================================================

export {
  zodToOpenApi,
  paginatedResponseSchema,
  errorResponseSchema,
} from './utils/zod-to-openapi.util';
