/**
 * @file link-metadata.interface.ts
 * @module @stackra/nestjs-link/interfaces
 * @description Compiled link metadata — the resolved output of `defineLink()`.
 *
 * After `defineLink()` processes the user's options, it produces a
 * `LinkMetadata` object with all values resolved (no optionals — everything
 * has a concrete value). This metadata is:
 * - Stored in the `LinkRegistry` for runtime lookups
 * - Used by `generateLinkSchema()` to create the MikroORM EntitySchema
 * - Used by `LinkService` to know which table/columns to operate on
 *
 * Think of `LinkOptions` as the input and `LinkMetadata` as the output.
 */

import { IType } from '@nestjs/common';
import type { ILinkColumnDefinition } from './link-column.interface';
import type { ILinkExtends } from './link-extends.interface';

/**
 * Cardinality of the link relationship.
 */
export type LinkCardinality = 'many-to-many' | 'one-to-many' | 'one-to-one';

/**
 * Fully-resolved metadata for a registered link.
 * All fields are concrete (no optionals) — defaults have been applied.
 */
export interface ILinkMetadata {
  /**
   * Unique link name (e.g., 'RolePermission', 'ProductSalesChannel').
   * Derived from source + target entity names.
   */
  name: string;

  /**
   * The source entity class reference.
   */
  source: IType<any>;

  /**
   * The target entity class reference.
   */
  target: IType<any>;

  /**
   * The pivot table name in the database.
   */
  table: string;

  /**
   * Source FK column name on the pivot table.
   */
  sourceFk: string;

  /**
   * Target FK column name on the pivot table.
   */
  targetFk: string;

  /**
   * Relation name on the source entity (points to targets).
   */
  sourceRelation: string;

  /**
   * Relation name on the target entity (points to sources).
   */
  targetRelation: string;

  /**
   * Whether the pivot table has `created_at` / `updated_at` columns.
   */
  timestamps: boolean;

  /**
   * Whether the pivot table has a `deleted_at` column for soft-deletes.
   */
  softDeletes: boolean;

  /**
   * Whether deleting the source entity cascades to pivot records.
   */
  deleteCascadeSource: boolean;

  /**
   * Whether deleting the target entity cascades to pivot records.
   */
  deleteCascadeTarget: boolean;

  /**
   * Whether this is a read-only (virtual) link with no pivot table.
   */
  readOnly: boolean;

  /**
   * Cardinality of the relationship.
   * Determines unique constraints and attach/detach behavior.
   */
  cardinality: LinkCardinality;

  /**
   * Whether detach orphans records (sets sourceFk to null) instead of deleting.
   * Only meaningful for one-to-many and one-to-one cardinalities.
   */
  orphan: boolean;

  /**
   * Conflict resolution strategy for one-to-many when target is already linked.
   */
  onConflict: 'error' | 'reassign' | 'skip';

  /**
   * Extra columns on the pivot table (fully resolved definitions).
   */
  columns: Record<string, ILinkColumnDefinition>;

  /**
   * Database connection name (undefined = default connection).
   */
  connection?: string;

  /**
   * Cross-module query traversal extensions.
   * Defines how this link extends entities with new traversable relationships.
   */
  extends: ILinkExtends[];

  /**
   * The generated MikroORM EntitySchema for the pivot table.
   * Populated during module initialization (not at defineLink time).
   */
  schema?: any;
}
