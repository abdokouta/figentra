/**
 * @file link-options.interface.ts
 * @module @stackra/nestjs-link/interfaces
 * @description Input options for the `defineLink()` factory function.
 *
 * This is the primary API surface for defining a link between two entities.
 * The options control:
 * - Which entities are linked (source + target)
 * - How the pivot table is named and structured
 * - What extra columns exist on the pivot
 * - Whether timestamps and soft-deletes are enabled
 * - Cascade behavior on delete
 *
 * Most options are auto-derived from entity names if not provided,
 * following a convention-over-configuration approach.
 *
 * @example
 * ```typescript
 * defineLink({
 *   source: Product,
 *   target: SalesChannel,
 *   sourceRelation: 'salesChannels',
 *   targetRelation: 'products',
 *   columns: {
 *     sort_order: { type: 'integer', default: 0 },
 *   },
 * });
 * ```
 */

import { IType } from '@nestjs/common';
import type { ILinkColumnDefinition, LinkColumnType } from './link-column.interface';
import type { ILinkExtends } from './link-extends.interface';
import { LinkCardinality } from './link-metadata.interface';

/**
 * Options for defining a link between two entities from different modules.
 */
export interface ILinkOptions {
  /**
   * The source entity class.
   * This is the "left side" of the many-to-many relationship.
   */
  source: IType<any>;

  /**
   * The target entity class.
   * This is the "right side" of the many-to-many relationship.
   */
  target: IType<any>;

  /**
   * Custom pivot table name.
   * If not provided, auto-derived by sorting and joining the snake_cased
   * entity names (e.g., Product + SalesChannel → 'product_sales_channel').
   */
  table?: string;

  /**
   * Database connection name for the pivot table.
   * Useful in multi-database setups. Defaults to the default connection.
   */
  connection?: string;

  /**
   * Relation name exposed on the source entity (points to targets).
   * Auto-derived from the target entity name (pluralized, camelCase).
   * E.g., target=Permission → sourceRelation='permissions'
   */
  sourceRelation?: string;

  /**
   * Relation name exposed on the target entity (points to sources).
   * Auto-derived from the source entity name (pluralized, camelCase).
   * E.g., source=Role → targetRelation='roles'
   */
  targetRelation?: string;

  /**
   * Source FK column name on the pivot table.
   * Auto-derived as `<snake_cased_source_name>_id`.
   * E.g., source=Role → sourceFk='role_id'
   */
  sourceFk?: string;

  /**
   * Target FK column name on the pivot table.
   * Auto-derived as `<snake_cased_target_name>_id`.
   * E.g., target=Permission → targetFk='permission_id'
   */
  targetFk?: string;

  /**
   * Whether the pivot table includes `created_at` and `updated_at` columns.
   * @default true
   */
  timestamps?: boolean;

  /**
   * Whether the pivot table includes a `deleted_at` column for soft-deletes.
   * When enabled, `detach()` marks records as deleted instead of removing them,
   * and queries automatically filter out soft-deleted records.
   * @default true
   */
  softDeletes?: boolean;

  /**
   * Whether deleting the source entity should cascade-delete its pivot records.
   * @default false
   */
  deleteCascadeSource?: boolean;

  /**
   * Whether deleting the target entity should cascade-delete its pivot records.
   * @default false
   */
  deleteCascadeTarget?: boolean;

  /**
   * Whether this is a read-only link (virtual relationship, no pivot table).
   * Read-only links define a relationship for querying purposes only —
   * no pivot table is generated, and attach/detach operations are not available.
   * @default false
   */
  readOnly?: boolean;

  /**
   * Cardinality of the relationship.
   *
   * - `'many-to-many'` (default): Standard pivot — both sides can have multiple.
   * - `'one-to-many'`: Source has many targets, each target belongs to one source.
   *   Adds a unique constraint on `targetFk`. Enables orphaning and conflict detection.
   * - `'one-to-one'`: Each source links to exactly one target and vice versa.
   *   Adds unique constraints on both FKs.
   *
   * @default 'many-to-many'
   *
   * @example
   * ```typescript
   * // Region has many countries, each country belongs to one region
   * defineLink({
   *   source: Region,
   *   target: Country,
   *   cardinality: 'one-to-many',
   *   orphan: true, // detach sets sourceFk to null instead of deleting
   * });
   * ```
   */
  cardinality?: LinkCardinality;

  /**
   * Whether detach operations should "orphan" records (set sourceFk to null)
   * instead of deleting/soft-deleting them.
   *
   * Only applicable when `cardinality` is `'one-to-many'` or `'one-to-one'`.
   * When `true`:
   * - `detach()` sets the source FK to null (record persists as orphaned)
   * - `attach()` can re-claim orphaned records (updates FK instead of creating)
   * - The source FK column becomes nullable in the schema
   *
   * When `false` (default): standard delete/soft-delete behavior.
   *
   * @default false
   */
  orphan?: boolean;

  /**
   * Conflict resolution strategy when `cardinality` is `'one-to-many'` and
   * a target is already linked to a different source.
   *
   * - `'error'` (default): Throw a ConflictException identifying the target
   *   and its current source.
   * - `'reassign'`: Silently move the target to the new source (update FK).
   * - `'skip'`: Silently skip targets that are already assigned elsewhere.
   *
   * Only applicable when `cardinality` is `'one-to-many'`.
   *
   * @default 'error'
   */
  onConflict?: 'error' | 'reassign' | 'skip';

  /**
   * Extra columns on the pivot table beyond the two FK columns.
   * Can be specified as a full `LinkColumnDefinition` or a shorthand type string.
   *
   * @example
   * ```typescript
   * columns: {
   *   sort_order: { type: 'integer', default: 0 },
   *   metadata: { type: 'json', nullable: true },
   *   label: 'string', // shorthand — same as { type: 'string', nullable: false }
   * }
   * ```
   */
  columns?: Record<string, ILinkColumnDefinition | LinkColumnType>;

  /**
   * Cross-module query traversal extensions.
   *
   * Defines how this link extends entities in other modules with new
   * traversable relationships. Used by `RemoteQueryService` to resolve
   * cross-module relations at query time.
   *
   * Each entry describes:
   * - Which entity gains a new relationship
   * - How to traverse from that entity to the related entity
   * - Field aliases for convenient access
   *
   * @example
   * ```typescript
   * extends: [
   *   {
   *     serviceName: 'CartModule',
   *     entity: 'Cart',
   *     fieldAlias: { region: 'region_link.region' },
   *     relationship: {
   *       serviceName: 'RegionModule',
   *       entity: 'Region',
   *       primaryKey: 'id',
   *       foreignKey: 'region_id',
   *       alias: 'region',
   *       isList: false,
   *     },
   *   },
   * ]
   * ```
   */
  extends?: ILinkExtends[];
}

/**
 * Re-export LinkColumnType for use in consumer code.
 */
export type { LinkColumnType } from './link-column.interface';
