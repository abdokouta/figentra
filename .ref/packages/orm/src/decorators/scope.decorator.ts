/**
 * @file scope.decorator.ts
 * @module @stackra/nestjs-orm/decorators
 * @description Decorators for defining reusable named query scopes on entity classes.
 *   Scopes encapsulate filter conditions that can be applied via the fluent QueryBuilder
 *   or automatically as default scopes.
 */

import { defineMetadata, getMetadata } from '@vivtel/metadata';

import type { IScopeDefinition } from '../query-builder/scope-registry';

// ============================================================================
// Metadata Keys
// ============================================================================

/** Metadata key for storing scope definitions on an entity class. */
export const SCOPE_METADATA = 'orm:scopes';

/** Metadata key for storing default scope names on an entity class. */
export const DEFAULT_SCOPE_METADATA = 'orm:default_scopes';

// ============================================================================
// Decorators
// ============================================================================

/**
 * Define a named query scope on an entity class.
 *
 * Scopes encapsulate reusable filter conditions that can be applied to queries
 * via `queryBuilder.scope('name')`. Scopes can be:
 * - **Static**: A plain conditions object (FilterQuery shape)
 * - **Dynamic**: A callback function that receives the QueryBuilder
 *
 * Multiple `@Scope()` decorators can be stacked on the same entity class.
 *
 * @param name - Unique scope name within this entity
 * @param conditionsOrCallback - Static conditions object or dynamic callback
 * @returns Class decorator
 *
 * @example Static scope:
 * ```typescript
 * @Scope('active', { is_active: true })
 * @Scope('published', { published_at: { $ne: null } })
 * @Entity({ tableName: 'products' })
 * export class Product extends BaseEntity { ... }
 * ```
 *
 * @example Dynamic scope:
 * ```typescript
 * @Scope('recent', (qb) => qb.where({ createdAt: { $gte: subDays(new Date(), 30) } }))
 * @Entity({ tableName: 'posts' })
 * export class Post extends BaseEntity { ... }
 * ```
 */
export function Scope(
  name: string,
  conditionsOrCallback: Record<string, unknown> | ((qb: any) => void)
): ClassDecorator {
  return (target: Function) => {
    const existing: IScopeDefinition[] =
      getMetadata<IScopeDefinition[]>(SCOPE_METADATA, target) || [];

    const scope: IScopeDefinition = {
      name,
      conditions: typeof conditionsOrCallback === 'function' ? undefined : conditionsOrCallback,
      callback: typeof conditionsOrCallback === 'function' ? conditionsOrCallback : undefined,
    };

    existing.push(scope);
    defineMetadata(SCOPE_METADATA, existing, target);
  };
}

/**
 * Declare default scopes that are automatically applied to all queries for this entity.
 *
 * Default scopes are applied unless explicitly bypassed with `queryBuilder.withoutScope('name')`.
 * The referenced scope names MUST be defined via `@Scope()` on the same entity.
 *
 * @param names - Scope names to apply by default
 * @returns Class decorator
 *
 * @example
 * ```typescript
 * @Scope('active', { is_active: true })
 * @Scope('notArchived', { archived_at: null })
 * @DefaultScope('active', 'notArchived')
 * @Entity({ tableName: 'products' })
 * export class Product extends BaseEntity { ... }
 * ```
 */
export function DefaultScope(...names: string[]): ClassDecorator {
  return (target: Function) => {
    defineMetadata(DEFAULT_SCOPE_METADATA, names, target);
  };
}

// ============================================================================
// Metadata Readers
// ============================================================================

/**
 * Read all scope definitions from an entity class.
 *
 * @param entityClass - The entity class constructor
 * @returns Array of scope definitions (empty if none registered)
 */
export function getScopes(entityClass: Function): IScopeDefinition[] {
  return getMetadata<IScopeDefinition[]>(SCOPE_METADATA, entityClass) || [];
}

/**
 * Read default scope names from an entity class.
 *
 * @param entityClass - The entity class constructor
 * @returns Array of default scope names (empty if none configured)
 */
export function getDefaultScopeNames(entityClass: Function): string[] {
  return getMetadata<string[]>(DEFAULT_SCOPE_METADATA, entityClass) || [];
}
