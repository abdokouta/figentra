/**
 * @file index.ts
 * @description Barrel export for all trait decorators.
 */

export { Timestamps } from './timestamps.decorator';
export { Userstamps } from './userstamps.decorator';
export { SoftDeletes } from './soft-deletes.decorator';
export { Versionable } from './versionable.decorator';
export { Archivable } from './archivable.decorator';
export { Sortable } from './sortable.decorator';
export { Publishable } from './publishable.decorator';
export { Expirable } from './expirable.decorator';
export {
  Sluggable,
  generateSlug,
  getSluggableConfig,
  type ISluggableConfig,
} from './sluggable.decorator';
export { HasMetadata } from './has-metadata.decorator';
export { Auditable, type IAuditableConfig } from './auditable.decorator';
export { Searchable, type ISearchableConfig } from './searchable.decorator';
export { Encrypted, type IEncryptedConfig } from './encrypted.decorator';
