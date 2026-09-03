/**
 * @file relation-options.interface.ts
 * @description Options for relation decorators (@HasMany, @BelongsTo, @ManyToMany, @HasOne).
 *
 * These are intra-module relations — defined directly on the entity class.
 * For cross-module pivot relationships, use `@stackra/nestjs-link` package instead.
 */

/**
 * Options for `@HasMany` — declares a one-to-many relationship.
 */
export interface HasManyOptions {
  /** Foreign key on the related entity. Auto-derived if omitted. */
  foreignKey?: string;
}

/**
 * Options for `@HasOne` — declares a one-to-one "has one" relationship.
 * The FK lives on the related (inverse) entity's table.
 */
export interface HasOneOptions {
  /** The FK column name on the related (inverse) entity. */
  foreignKey?: string;
  /** Whether to eagerly load this relation by default. */
  eager?: boolean;
}

/**
 * The internal shape stored in reflect-metadata for each relation.
 * One entry per decorated property.
 */
export interface StoredRelation {
  /** The relation kind. */
  type: 'hasMany' | 'belongsTo' | 'manyToMany' | 'hasOne';
  /** The property name on the entity that holds the relation. */
  propertyKey: string;
  /** Lazy thunk returning the related entity class (avoids circular imports). */
  target: () => any;
  /** Options passed to the decorator. */
  options: HasManyOptions | BelongsToOptions | ManyToManyOptions | HasOneOptions;
}
