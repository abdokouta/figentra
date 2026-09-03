/**
 * @file index.ts
 * @description Barrel export for all ORM decorators.
 */

export { Entity } from './entity.decorator';
export { Property } from './property.decorator';
export { PrimaryKey } from './primary-key.decorator';
export { EnumProperty } from './enum-property.decorator';
export { InjectRepository } from './inject-repository.decorator';
export {
  Stored,
  getStoredFields,
  getStoredFieldsByStrategy,
  getStoredFieldsBySuffix,
  getStoredSuffixes,
  STORED_METADATA,
} from './stored.decorator';
export type { StoredOptions, StoredField, StorageStrategy } from './stored.decorator';
export {
  Translatable,
  getTranslatableFields,
  getTranslatableFieldsByStrategy,
  TRANSLATABLE_METADATA,
} from './translatable.decorator';
export type {
  TranslatableField,
  TranslatableOptions,
  TranslationStrategy,
} from './translatable.decorator';

// Traits
export { Timestamps } from './traits/timestamps.decorator';
export { Userstamps } from './traits/userstamps.decorator';
export { SoftDeletes } from './traits/soft-deletes.decorator';
export { Versionable } from './traits/versionable.decorator';
export { Archivable } from './traits/archivable.decorator';
export { Sortable } from './traits/sortable.decorator';
export { Publishable } from './traits/publishable.decorator';
export { Expirable } from './traits/expirable.decorator';
export { Sluggable, generateSlug, getSluggableConfig } from './traits/sluggable.decorator';
export type { ISluggableConfig } from './traits/sluggable.decorator';
export { HasMetadata } from './traits/has-metadata.decorator';
export { Auditable } from './traits/auditable.decorator';
export type { IAuditableConfig } from './traits/auditable.decorator';
export { Searchable } from './traits/searchable.decorator';
export type { ISearchableConfig } from './traits/searchable.decorator';
export { Encrypted } from './traits/encrypted.decorator';
export type { IEncryptedConfig } from './traits/encrypted.decorator';

// Relations
export { HasMany } from './has-many.decorator';
export { BelongsTo } from './belongs-to.decorator';
export { ManyToMany } from './many-to-many.decorator';
export { HasOne } from './has-one.decorator';
export type { HasOneOptions } from './has-one.decorator';
export {
  RelationField,
  getRelationFields,
  RELATION_FIELD_METADATA,
} from './relation-field.decorator';
export type { IRelationFieldOptions, IStoredRelationField } from './relation-field.decorator';

// Scopes
export {
  Scope,
  DefaultScope,
  getScopes,
  getDefaultScopeNames,
  SCOPE_METADATA,
  DEFAULT_SCOPE_METADATA,
} from './scope.decorator';

// Eager Loading
export { EagerLoad, getEagerLoadRelations, EAGER_LOAD_METADATA } from './eager-load.decorator';

// Lifecycle Hooks
export {
  BeforeCreate,
  AfterCreate,
  BeforeUpdate,
  AfterUpdate,
  BeforeDelete,
  AfterDelete,
  getLifecycleHooks,
  LIFECYCLE_METADATA,
} from './lifecycle.decorator';
export type { LifecycleEvent } from './lifecycle.decorator';

// Tenant Scoped (deprecated)
export { TenantScoped } from './tenant-scoped.decorator';
