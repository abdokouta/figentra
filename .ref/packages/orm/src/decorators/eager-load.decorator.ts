/**
 * @file eager-load.decorator.ts
 * @module @stackra/nestjs-orm/decorators
 * @description Decorator for declaring default eager-loaded relations on an entity class.
 *   Relations specified via `@EagerLoad()` are automatically added to the `populate`
 *   option on every query issued by the generated service.
 */

import { defineMetadata, getMetadata } from '@vivtel/metadata';

// ============================================================================
// Metadata Key
// ============================================================================

/** Metadata key for storing eager-load relation names on an entity class. */
export const EAGER_LOAD_METADATA = 'orm:eager_load';

// ============================================================================
// Decorator
// ============================================================================

/**
 * Declare relations to auto-populate on every query for this entity.
 *
 * When applied, the generated service (via `defineService()`) will automatically
 * add these relations to the `populate` option of every `find`, `findOne`, and
 * paginate call. If a query explicitly specifies its own `populate`, the two
 * sets are merged (set union, no duplicates).
 *
 * Supports dot-notation for nested relations (e.g., `'author.profile'`).
 *
 * @param relations - Array of relation names to auto-populate
 * @returns Class decorator
 *
 * @example
 * ```typescript
 * @EagerLoad(['translations', 'category'])
 * @Entity({ tableName: 'products' })
 * export class Product extends BaseEntity {
 *   // translations and category will be auto-populated on every query
 * }
 * ```
 *
 * @example Nested relations:
 * ```typescript
 * @EagerLoad(['author', 'author.profile', 'comments'])
 * @Entity({ tableName: 'posts' })
 * export class Post extends BaseEntity { ... }
 * ```
 */
export function EagerLoad(relations: string[]): ClassDecorator {
  return (target: Function) => {
    defineMetadata(EAGER_LOAD_METADATA, relations, target);
  };
}

// ============================================================================
// Metadata Reader
// ============================================================================

/**
 * Read eager-load relation names from an entity class.
 *
 * @param entityClass - The entity class constructor
 * @returns Array of relation names to eager-load (empty if none declared)
 */
export function getEagerLoadRelations(entityClass: Function): string[] {
  return getMetadata<string[]>(EAGER_LOAD_METADATA, entityClass) || [];
}
