/**
 * @file stored-field.interface.ts
 * @module @stackra/orm/src/interfaces
 * @description StoredField interface.
 */

/** Stored field metadata. */
export interface StoredField {
  propertyKey: string;
  strategy: StorageStrategy;
  suffix: string;
  partitionBy?: string;
  type?: string;
  nullable?: boolean;
}
