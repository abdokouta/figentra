/**
 * @file relation-field.decorator.ts
 * @module @stackra/nestjs-orm/decorators
 * @description Declarative decorator for auto-resolved GraphQL relation fields.
 *
 *   `@RelationField()` is an opt-in alternative to writing manual `@ResolveField()`
 *   methods with `@Loader()` injection. When applied to an entity property, it
 *   stores metadata that the resolver factory reads to auto-generate a
 *   `@ResolveField()` method wired to the correct DataLoader.
 *
 *   ## When to Use
 *   - On entity classes used with `defineResolver()` (auto-generated resolvers)
 *   - When the relationship follows standard FK conventions
 *   - When you want zero-config DataLoader wiring for a specific field
 *
 *   ## When NOT to Use
 *   - On custom resolvers (write `@ResolveField()` + `@Loader()` manually)
 *   - When the relationship needs custom filtering/sorting logic
 *   - When the DataLoader key doesn't follow the standard convention
 *
 *   ## Behavior
 *   - `@RelationField(() => User, { foreignKey: 'author_id' })` on a `BelongsTo`
 *     relation tells the resolver to resolve this field via `@Loader('user').load(parent.author_id)`
 *   - `@RelationField(() => [Comment], { foreignKey: 'post_id' })` on a `HasMany`
 *     relation resolves via `@Loader('comment:post_id').load(parent.id)`
 *
 *   Unlike `@HasMany`/`@BelongsTo` (which store ORM relationship metadata for
 *   schema generation), `@RelationField` is purely for GraphQL resolver wiring.
 *   You typically apply BOTH: `@HasMany` for the DB schema + `@RelationField` for GQL.
 */

import { defineMetadata, getMetadata } from '@vivtel/metadata';

// ============================================================================
// Metadata Key
// ============================================================================

/** Reflect-metadata key for relation field definitions. */
export const RELATION_FIELD_METADATA = Symbol('orm:relation-fields');

// ============================================================================
// Types
// ============================================================================

// ============================================================================
// Decorator
// ============================================================================

/**
 * Declarative decorator for auto-resolved GraphQL relation fields.
 *
 * Applied to entity properties to instruct `defineResolver()` to generate
 * a `@ResolveField()` method that uses the DataLoader system automatically.
 *
 * @param target - Thunk returning the related entity class. Use `() => [Entity]` for collections.
 * @param options - Configuration (foreignKey is required)
 * @returns Property decorator
 *
 * @example BelongsTo (single entity):
 * ```typescript
 * @Entity({ tableName: 'posts' })
 * export class Post extends BaseEntity {
 *   @Property({ type: 'uuid', index: true })
 *   author_id!: string;
 *
 *   @BelongsTo(() => User, { foreignKey: 'author_id' })
 *   @RelationField(() => User, { foreignKey: 'author_id' })
 *   author!: User;
 * }
 * ```
 *
 * @example HasMany (collection):
 * ```typescript
 * @Entity({ tableName: 'users' })
 * export class User extends BaseEntity {
 *   @HasMany(() => Post, { foreignKey: 'author_id' })
 *   @RelationField(() => [Post], { foreignKey: 'author_id', many: true })
 *   posts!: Post[];
 * }
 * ```
 */
export function RelationField(
  target: () => any,
  options: IRelationFieldOptions
): PropertyDecorator {
  return (proto: object, propertyKey: string | symbol) => {
    const existing: IStoredRelationField[] =
      getMetadata<IStoredRelationField[]>(RELATION_FIELD_METADATA, proto) || [];

    existing.push({
      propertyKey: String(propertyKey),
      target,
      options,
    });

    defineMetadata(RELATION_FIELD_METADATA, existing, proto);
  };
}

// ============================================================================
// Reader Utility
// ============================================================================

/**
 * Read all `@RelationField()` metadata from an entity class.
 *
 * Used by `defineResolver()` to auto-generate `@ResolveField()` methods.
 *
 * @param entity - The entity class to read metadata from
 * @returns Array of stored relation field definitions
 */
export function getRelationFields(entity: Function): IStoredRelationField[] {
  return getMetadata<IStoredRelationField[]>(RELATION_FIELD_METADATA, entity.prototype) || [];
}
