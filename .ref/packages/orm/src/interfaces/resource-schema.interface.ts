/**
 * @file resource-schema.interface.ts
 * @module @stackra/orm/src/interfaces
 * @description IResourceSchema interface.
 */

/**
 * Complete resource schema — describes an entity's shape, relations, and metadata.
 * Served to the frontend via GET /schema for runtime consumption.
 */
export interface IResourceSchema {
  /** Resource name (matches tableName, used as key everywhere). */
  resource: string;
  /** Primary key field name. */
  primaryKey: string;
  /** All fields with types and metadata. */
  fields: IFieldSchema[];
  /** Relations to other resources. */
  relations: IRelationSchema[];
  /** JSON Schema (Draft 7) for validation of writable fields. */
  validation: Record<string, unknown>;
  /** Applied entity traits. */
  traits: {
    timestamps: boolean;
    softDeletes: boolean;
    versionable: boolean;
    archivable: boolean;
    sortable: boolean;
    publishable: boolean;
    expirable: boolean;
  };
  /** Offline/sync metadata (from @Offlineable decorator). */
  offline: {
    enabled: boolean;
    conflictStrategy: string;
    timestampField: string;
    syncOnReconnect: boolean;
  };
}
