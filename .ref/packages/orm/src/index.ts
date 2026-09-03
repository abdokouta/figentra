/**
 * @file index.ts
 * @description Main barrel export for the @stackra/nestjs-orm package.
 * Re-exports all public APIs from sub-modules.
 */

// Constants
export { ENTITY_METADATA, PROPERTY_METADATA, TRAIT_METADATA } from './constants';
export { REPOSITORY_TOKEN_PREFIX } from './constants';
export { GQL_ARG, GQL_DEFAULTS } from './constants';
export { ORM_TRANSLATIONS } from './constants';

// Interfaces
export type { StoredProperty } from './interfaces';
export type { StoredEntityMeta } from './interfaces';
export type { ICrudService } from './interfaces';
export type { EntityRegistration } from './interfaces';

// Enums
export { SortDirection } from './enums';
export { defineEnum } from './enums';

// Base Entity
export { BaseEntity } from './entity';

// Decorators
export { Entity } from './decorators';
export { Property } from './decorators';
export { PrimaryKey } from './decorators';
export { EnumProperty } from './decorators';
export { InjectRepository } from './decorators';
export {
  Stored,
  getStoredFields,
  getStoredFieldsByStrategy,
  getStoredFieldsBySuffix,
  getStoredSuffixes,
  STORED_METADATA,
} from './decorators';
export type { StoredField, StorageStrategy } from './decorators';
export {
  Translatable,
  getTranslatableFields,
  getTranslatableFieldsByStrategy,
  TRANSLATABLE_METADATA,
} from './decorators';
export type { TranslatableField, TranslationStrategy } from './decorators';
export { Timestamps } from './decorators';
export { Userstamps } from './decorators';
export { SoftDeletes } from './decorators';
export { Versionable } from './decorators';
export { Archivable } from './decorators';
export { Sortable } from './decorators';
export { Publishable } from './decorators';
export { Expirable } from './decorators';
export { Sluggable, generateSlug } from './decorators';
export { Auditable } from './decorators';
export { Searchable } from './decorators';
export { Encrypted } from './decorators';
export { RelationField, getRelationFields, RELATION_FIELD_METADATA } from './decorators';
export type { IStoredRelationField } from './decorators';

// Scope Decorators
export {
  Scope,
  DefaultScope,
  getScopes,
  getDefaultScopeNames,
  SCOPE_METADATA,
  DEFAULT_SCOPE_METADATA,
} from './decorators';

// EagerLoad Decorator
export { EagerLoad, getEagerLoadRelations, EAGER_LOAD_METADATA } from './decorators';

// Lifecycle Decorators
export {
  BeforeCreate,
  AfterCreate,
  BeforeUpdate,
  AfterUpdate,
  BeforeDelete,
  AfterDelete,
  getLifecycleHooks,
  LIFECYCLE_METADATA,
} from './decorators';
export type { LifecycleEvent } from './decorators';

// Utils
export { addProperty } from './utils';
export { addTrait } from './utils';
export { getProperties } from './utils';
export { collectProperties } from './utils';
export { resolveGraphQLType } from './utils';
export { buildPropertyDefinition } from './utils';
export { getEntityName } from './utils';
export { getRepositoryToken } from './utils';
export { getLoaderKey, getFkLoaderKey } from './utils';

// Schema
export { defineSchema, collectSchemas } from './schema';
export { buildTranslationSchema } from './schema';
export { generateZodSchemas } from './schema';
export type { IGeneratedSchemas } from './schema';

// Filters (query building — platform-agnostic, used by both GraphQL and HTTP)
export { buildFilterQuery } from './filters';
export { buildSortQuery } from './filters';

// Filters (GraphQL InputTypes — prefer importing from '@stackra/nestjs-orm/graphql')
export { StringFilter } from './filters';
export { NumberFilter } from './filters';
export { DateFilter } from './filters';
export { BooleanFilter } from './filters';

// Factories
export { defineService } from './factories';
export { defineResolver } from './factories';

// SEO Field Generator (auto-attached by defineResolver — re-exported here
// for direct use and for consumers that want to opt out via @SkipSeoField).
export {
  SeoMetaType,
  SkipSeoField,
  attachSeoFieldIfApplicable,
  entityHasSeoColumns,
  SEO_COLUMNS,
  SKIP_SEO_FIELD_KEY,
} from './graphql/seo-field-generator';

// HTTP Controller Factory
export { defineController } from './http/generators/crud-controller.factory';
export type {
  DefineControllerOptions,
  ControllerActions,
} from './http/generators/crud-controller.factory';

// Module
export { OrmModule, setGlobalIndexer, getGlobalIndexer } from './orm.module';

// Cache Integration (optional — set by app at bootstrap if @stackra/cache is available)
export function setGlobalCacheManager(manager: any): void {
  (globalThis as any).__ORM_CACHE_MANAGER__ = manager;
}
export function getGlobalCacheManager(): any {
  return (globalThis as any).__ORM_CACHE_MANAGER__ || null;
}

// Health Indicator
export { DatabaseHealthIndicator } from './indicators';

// Entity Filters
export {
  softDeleteFilter,
  SOFT_DELETE_FILTER_NAME,
  publishedFilter,
  PUBLISHED_FILTER_NAME,
  notExpiredFilter,
  NOT_EXPIRED_FILTER_NAME,
  notArchivedFilter,
  NOT_ARCHIVED_FILTER_NAME,
} from './entity-filters';

// Errors
export {
  OrmException,
  UniqueConstraintError,
  ReferenceConstraintError,
  OptimisticLockError,
  DatabaseConnectionError,
  wrapFlushError,
} from './errors';

// Query Builder
export { ScopeRegistry, FluentQueryBuilder } from './query-builder';
export type { IScopeDefinition, IPaginatedResult } from './query-builder';

// Subscribers
export { LifecycleHooksSubscriber } from './subscribers';

// Services
export { EntityRegistryService } from './services';

// CLI Utilities
export { defineCliConfig, closeOrmCliContext } from './cli';

// Links — REMOVED. Use the @stackra/nestjs-link package directly.
// `defineLink`, `LinkModule`, `LinkService`, `LinkRegistry`, `InjectLink`,
// `generateLinkSchema`, `LinkOptions`, `LinkMetadata`, etc. all live in @stackra/nestjs-link.

// Relations (intra-module @HasMany / @BelongsTo / @ManyToMany / @HasOne metadata)
export { RELATION_METADATA } from './relations';
export type {
  HasManyOptions,
  BelongsToOptions,
  ManyToManyOptions,
  HasOneOptions as HasOneRelationOptions,
  StoredRelation,
  RelationPivotColumn,
} from './relations';

// Relation decorators
export { HasMany } from './decorators';
export { BelongsTo } from './decorators';
export { ManyToMany } from './decorators';
export { HasOne } from './decorators';

// Seeders
export { BaseSeeder } from './seeders/base.seeder';
export { SeederContext } from './seeders/seeder-context';
export { DatabaseSeeder } from './seeders/database.seeder';

// Factories
export { BaseFactory } from './factories/base.factory';

// Schema Registry (runtime schema exposure for frontend)
export { SchemaRegistry, SchemaRegistryPopulator, SchemaController } from './schema-registry';
export { entityToJsonSchema } from './schema-registry';
export type { IResourceSchema, IFieldSchema, IRelationSchema } from './schema-registry';

// ============================================================================
// Commands (auto-discovered by @stackra/console)
// ============================================================================
export {
  // Migration
  MigrationCreateCommand,
  MigrationGenerateCommand,
  MigrationRunCommand,
  MigrationRollbackCommand,
  MigrationStatusCommand,
  MigrationFreshCommand,
  // Database
  DbSeedCommand,
  DbWipeCommand,
  // Schema
  SchemaUpdateCommand,
  SchemaDumpCommand,
  // Scaffolding
  MakeEntityCommand,
  MakeSeederCommand,
  MakeFactoryCommand,
  // CRUD (generic — works with any entity)
  EntityCreateCommand,
  EntityListCommand,
  EntityShowCommand,
  EntityUpdateCommand,
  EntityDeleteCommand,
  EntityCountCommand,
} from './commands';

// ============================================================================
// Subpath Exports (Documentation)
// ============================================================================
//
// This package provides two additional subpath exports:
//
// @stackra/nestjs-orm/graphql
//   - defineResolver, generateDtos, GraphQL filter input types
//   - Pagination types (Relay connections, Page types)
//   - GraphQL detection and field application utilities
//   - GQL_ARG, GQL_DEFAULTS constants
//
// @stackra/nestjs-orm/http
//   - defineController, CRUD REST controller generation
//   - Response formatting (paginated, entity)
//   - Pagination/filter/sort query parsing
//   - @ApiPaginated, @ApiFilterable, @ApiSortable decorators
//
// Usage:
//   import { defineResolver } from '@stackra/nestjs-orm/graphql';
//   import { defineController } from '@stackra/nestjs-orm/http';
//

// ============================================================================
// State Machine
// ============================================================================
export { StateMachineService } from './state-machine';
export { defineState } from './state-machine';
export type { IStateTransition, ITransitionResult } from './state-machine';

// ============================================================================
// Tenant Scoped (Deprecated — use @Scoped() from @stackra/scope instead)
// ============================================================================
export { TenantScoped } from './decorators';
