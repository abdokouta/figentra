/**
 * @file translatable-field.interface.ts
 * @module @stackra/orm/src/interfaces
 * @description TranslatableField interface.
 */

/** Stored translatable field info. */
export interface TranslatableField {
  propertyKey: string;
  strategy: StorageStrategy;
}
