/**
 * @file relation-field-options.interface.ts
 * @module @stackra/orm/src/interfaces
 * @description IRelationFieldOptions interface.
 */

/**
 * Configuration options for `@RelationField()`.
 */
export interface IRelationFieldOptions {
  /**
   * The foreign key column name.
   *
   * - For `BelongsTo`: the FK column on THIS entity (e.g., `'author_id'`)
   * - For `HasMany`: the FK column on the RELATED entity (e.g., `'post_id'`)
   */
  foreignKey: string;

  /**
   * Whether this is a collection (HasMany/ManyToMany) or single (BelongsTo).
   * Auto-detected from the return type thunk — if it returns an array type, it's a collection.
   * Can be explicitly set to override detection.
   */
  many?: boolean;

  /**
   * Custom DataLoader key. Defaults to:
   * - BelongsTo: lowercase related entity name (e.g., `'user'`)
   * - HasMany: `{relatedEntity}:{foreignKey}` (e.g., `'comment:post_id'`)
   */
  loaderKey?: string;

  /**
   * Whether the field is nullable (BelongsTo with optional FK).
   * Default: false for HasMany, true for BelongsTo.
   */
  nullable?: boolean;
}
