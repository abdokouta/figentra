/**
 * @file stored-relation-field.interface.ts
 * @module @stackra/orm/src/interfaces
 * @description IStoredRelationField interface.
 */

/**
 * Stored metadata for a single `@RelationField()` decoration.
 */
export interface IStoredRelationField {
  /** Property name on the entity class. */
  propertyKey: string;
  /** Thunk returning the related entity class (or array wrapper). */
  target: () => any;
  /** Resolved options. */
  options: IRelationFieldOptions;
}
