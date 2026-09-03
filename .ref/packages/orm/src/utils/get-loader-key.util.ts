/**
 * @file get-loader-key.util.ts
 * @module @stackra/nestjs-orm/utils
 * @description Utility to derive the DataLoader registry key for an entity class.
 *
 *   The loader key is the **lowercase entity name** — matching the key used by
 *   `OrmModule.forFeature()` when registering entities with the
 *   `EntityDataLoaderFactory` from `@stackra/nestjs-graphql`.
 *
 *   ## Convention
 *   - Entity class `User` → loader key `"user"`
 *   - Entity class `SalesChannel` → loader key `"saleschannel"`
 *   - Entity class `BusinessUnit` → loader key `"businessunit"`
 *   - Custom name via `@Entity({ name: 'custom' })` → loader key `"custom"`
 *
 *   The key is used with `@Loader('user')` in GraphQL resolvers.
 */

import { getMetadata } from '@vivtel/metadata';
import { ENTITY_METADATA } from '../constants/metadata-keys.constant';

/**
 * Derive the DataLoader registry key for an entity class.
 *
 * Resolution order:
 * 1. `@Entity({ name })` metadata (if the entity has a custom name)
 * 2. Class name lowercased
 *
 * @param entity - The entity class (must have `@Entity()` decorator applied)
 * @returns The lowercase loader key string
 *
 * @example
 * ```typescript
 * import { getLoaderKey } from '@stackra/nestjs-orm';
 *
 * getLoaderKey(User);          // → 'user'
 * getLoaderKey(SalesChannel);  // → 'saleschannel'
 * ```
 */
export function getLoaderKey(entity: Function): string {
  const meta = getMetadata(ENTITY_METADATA, entity);
  const name = meta?.name || entity.name;
  return name.toLowerCase();
}

/**
 * Derive the DataLoader registry key for a one-to-many (FK-based) relationship.
 *
 * These loaders batch by foreign key field rather than primary key.
 * Convention: `{entityKey}:{fkField}` (e.g., `"comment:post_id"`)
 *
 * @param entity - The related entity class
 * @param foreignKey - The foreign key field name on the related entity
 * @returns The composite loader key string
 *
 * @example
 * ```typescript
 * getFkLoaderKey(Comment, 'post_id'); // → 'comment:post_id'
 * ```
 */
export function getFkLoaderKey(entity: Function, foreignKey: string): string {
  return `${getLoaderKey(entity)}:${foreignKey}`;
}
