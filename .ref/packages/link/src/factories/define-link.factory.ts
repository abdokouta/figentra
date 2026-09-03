/**
 * @file define-link.ts
 * @module @stackra/nestjs-link/factories
 * @description The `defineLink()` factory — the primary API for declaring links.
 *
 * `defineLink()` is a pure function that takes link options and returns
 * fully-resolved `LinkMetadata`. It does NOT register anything globally
 * or cause side effects — registration happens when the metadata is
 * passed to `LinkModule.forFeature()`.
 *
 * ## How It Works
 * 1. Takes source + target entity classes and optional configuration
 * 2. Auto-derives all missing values (table name, FK columns, relation names)
 * 3. Normalizes extra column definitions
 * 4. Returns a `LinkMetadata` object ready for registration
 *
 * ## Convention-Over-Configuration
 * Most options are auto-derived from entity names:
 * - Table name: sorted snake_case join (e.g., 'product_sales_channel')
 * - Source FK: `<source_snake>_id` (e.g., 'product_id')
 * - Target FK: `<target_snake>_id` (e.g., 'sales_channel_id')
 * - Source relation: pluralized target name (e.g., 'salesChannels')
 * - Target relation: pluralized source name (e.g., 'products')
 *
 * ## Usage
 * ```typescript
 * import { defineLink } from '@stackra/nestjs-link';
 * import { Role } from '../entities/role.entity';
 * import { Permission } from '../entities/permission.entity';
 *
 * export const RolePermissionLink = defineLink({
 *   source: Role,
 *   target: Permission,
 *   sourceRelation: 'permissions',
 *   targetRelation: 'roles',
 * });
 *
 * // Self-referencing link (role inheritance)
 * export const RoleParentLink = defineLink({
 *   source: Role,
 *   target: Role,
 *   table: 'role_parents',
 *   sourceFk: 'role_id',
 *   targetFk: 'parent_id',
 *   sourceRelation: 'parents',
 *   targetRelation: 'children',
 * });
 * ```
 */

import type { ILinkOptions, LinkColumnType } from '../interfaces/link-options.interface';
import type { ILinkMetadata } from '../interfaces/link-metadata.interface';
import type { ILinkColumnDefinition } from '../interfaces/link-column.interface';
import { Str } from '@stackra/ts-support';
import { composeLinkName } from '../utils/compose-link-name.util';
import { composeTableName } from '../utils/compose-table-name.util';

/**
 * Defines a link between two entities from different (or same) modules.
 *
 * This is the main API for declaring many-to-many relationships.
 * Returns metadata that should be passed to `LinkModule.forFeature()`
 * for registration and pivot table generation.
 *
 * @param options - Link configuration options
 * @returns Fully-resolved LinkMetadata ready for registration
 *
 * @example
 * ```typescript
 * export const ProductSalesChannelLink = defineLink({
 *   source: Product,
 *   target: SalesChannel,
 *   columns: {
 *     sort_order: { type: 'integer', default: 0 },
 *   },
 * });
 * ```
 */
export function defineLink(options: ILinkOptions): ILinkMetadata {
  const sourceName = options.source.name;
  const targetName = options.target.name;

  // ─── Auto-derive relation names ──────────────────────────────────────────────
  const sourceRelation = options.sourceRelation || Str.plural(Str.lower(targetName));
  const targetRelation = options.targetRelation || Str.plural(Str.lower(sourceName));

  // ─── Auto-derive table name ──────────────────────────────────────────────────
  const table = options.table || composeTableName(sourceName, targetName, sourceRelation);

  // ─── Auto-derive FK column names ────────────────────────────────────────────
  const sourceFk = options.sourceFk || `${Str.snake(sourceName)}_id`;
  const targetFk = options.targetFk || `${Str.snake(targetName)}_id`;

  // ─── Derive link name ────────────────────────────────────────────────────────
  const name = composeLinkName(options.source, options.target, sourceRelation, targetRelation);

  // ─── Normalize extra columns ─────────────────────────────────────────────────
  const columns: Record<string, ILinkColumnDefinition> = {};
  if (options.columns) {
    for (const [key, value] of Object.entries(options.columns)) {
      if (typeof value === 'string') {
        // Shorthand: just a type string → expand to full definition
        columns[key] = {
          type: value as LinkColumnType,
          nullable: false,
        };
      } else {
        columns[key] = value;
      }
    }
  }

  // ─── Build and return metadata ───────────────────────────────────────────────
  const cardinality = options.cardinality ?? 'many-to-many';
  const orphan = options.orphan ?? false;
  const onConflict = options.onConflict ?? 'error';

  // Validate: orphan only makes sense for one-to-many or one-to-one
  if (orphan && cardinality === 'many-to-many') {
    throw new Error(
      `defineLink("${name}"): 'orphan: true' is only valid with ` +
        `cardinality 'one-to-many' or 'one-to-one', not 'many-to-many'.`
    );
  }

  // Validate: onConflict only makes sense for one-to-many
  if (options.onConflict && cardinality === 'many-to-many') {
    throw new Error(
      `defineLink("${name}"): 'onConflict' is only valid with ` +
        `cardinality 'one-to-many' or 'one-to-one', not 'many-to-many'.`
    );
  }

  return {
    name,
    source: options.source,
    target: options.target,
    table,
    sourceFk,
    targetFk,
    sourceRelation,
    targetRelation,
    timestamps: options.timestamps ?? true,
    softDeletes: options.softDeletes ?? true,
    deleteCascadeSource: options.deleteCascadeSource ?? false,
    deleteCascadeTarget: options.deleteCascadeTarget ?? false,
    readOnly: options.readOnly ?? false,
    cardinality,
    orphan,
    onConflict,
    columns,
    connection: options.connection,
    extends: options.extends ?? [],
  };
}
