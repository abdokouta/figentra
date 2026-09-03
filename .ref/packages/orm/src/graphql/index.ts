/**
 * @file index.ts
 * @module @stackra/nestjs-orm/graphql
 * @description GraphQL layer for the ORM package.
 *   Provides resolver generation, DTO auto-generation, filter/sort input types,
 *   pagination types (Relay connections), and GraphQL detection utilities.
 *
 *   Import from `@stackra/nestjs-orm/graphql` to access these features.
 *   This subpath has `@nestjs/graphql` as a required peer dependency.
 */

// ============================================================================
// Resolver Factory
// ============================================================================

export { defineResolver } from '../factories/crud-resolver.factory';
export type { DefineResolverOptions } from '../factories/crud-resolver.factory';

// ============================================================================
// DTO Generator
// ============================================================================

export { generateDtos } from './generators/dto-generator.factory';
export type { GeneratedDtos } from './generators/dto-generator.factory';

// ============================================================================
// GraphQL Filter Input Types
// ============================================================================

export { StringFilter } from '../filters/string-filter.input';
export { NumberFilter } from '../filters/number-filter.input';
export { DateFilter } from '../filters/date-filter.input';
export { BooleanFilter } from '../filters/boolean-filter.input';

// ============================================================================
// GraphQL Utilities
// ============================================================================

export { resolveGraphQLType } from '../utils/resolve-graphql-type.util';
export { isGraphQLAvailable, resetGraphQLDetection } from './utils/graphql-detection.util';
export { applyGraphQLField, applyGraphQLIntField } from './utils/apply-graphql-field.util';

// ============================================================================
// Pagination Types
// ============================================================================

export type { RelayConnection, RelayArgs } from './interfaces/relay-connection.interface';
export {
  createPageType,
  createSimplePageType,
  createConnectionType,
} from './types/pagination-types';

// ============================================================================
// Constants
// ============================================================================

export { GQL_ARG, GQL_DEFAULTS } from '../constants';

// ============================================================================
// DataLoader Utilities
// ============================================================================

export { getLoaderKey, getFkLoaderKey } from '../utils/get-loader-key.util';

// ============================================================================
// SEO Field Generator
// ============================================================================

export {
  SeoMetaType,
  SkipSeoField,
  attachSeoFieldIfApplicable,
  entityHasSeoColumns,
  SEO_COLUMNS,
  SKIP_SEO_FIELD_KEY,
} from './seo-field-generator';
