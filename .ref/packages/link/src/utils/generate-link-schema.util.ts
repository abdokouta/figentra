/**
 * @file generate-link-schema.ts
 * @module @stackra/nestjs-link/schema
 * @description Dynamically generates a MikroORM EntitySchema for a link's pivot table.
 *
 * This is the bridge between `LinkMetadata` (our declarative config) and
 * MikroORM's runtime entity system. Instead of writing static entity classes
 * for every pivot table, we generate them on-the-fly from metadata.
 *
 * ## What Gets Generated
 * For each link, an EntitySchema is created with:
 * - `id` column (UUID, primary key)
 * - Source FK column (string, indexed)
 * - Target FK column (string, indexed)
 * - Any extra columns defined in `options.columns`
 * - `created_at` / `updated_at` (if timestamps enabled)
 * - `deleted_at` (if soft-deletes enabled)
 * - Composite unique index on [sourceFk, targetFk] (prevents duplicates)
 * - Partial indexes on FK columns (WHERE deleted_at IS NULL)
 * - Soft-deletable filter (auto-excludes deleted records from queries)
 *
 * ## MikroORM Integration
 * The generated schema is passed to `OrmModule.forRoot({ entities: [...getLinkSchemas(...)] })`
 * at the root level. MikroORM treats it like any
 * other entity — it can be queried, migrated, and managed normally.
 *
 * @example
 * ```typescript
 * const metadata = defineLink({ source: Role, target: Permission });
 * const schema = generateLinkSchema(metadata);
 * // schema is now a MikroORM EntitySchema ready for registration
 * ```
 */

import { EntitySchema } from '@mikro-orm/core';
import type { ILinkMetadata } from '../interfaces/link-metadata.interface';
import type { ILinkColumnDefinition } from '../interfaces/link-column.interface';

/**
 * Maps our LinkColumnType to MikroORM property types.
 */
const COLUMN_TYPE_MAP: Record<string, string> = {
  string: 'string',
  text: 'text',
  integer: 'integer',
  float: 'double',
  boolean: 'boolean',
  json: 'json',
  date: 'Date',
  uuid: 'string',
};

/**
 * Generates a dynamic class to serve as the entity prototype.
 * MikroORM requires a class reference for EntitySchema — we create
 * one dynamically with the correct property names.
 *
 * @param properties - Array of property names the class should have
 * @returns A class constructor with the given properties
 */
function createLinkModelClass(properties: string[]): any {
  return class LinkModel {
    constructor() {
      for (const prop of properties) {
        (this as any)[prop] = undefined;
      }
    }
  };
}

/**
 * Generates a MikroORM EntitySchema for a link's pivot table.
 *
 * @param metadata - The fully-resolved link metadata
 * @returns A MikroORM EntitySchema ready for registration
 */
export function generateLinkSchema(metadata: ILinkMetadata): EntitySchema {
  // ─── Collect all property names ──────────────────────────────────────────────
  const propertyNames = ['id', metadata.sourceFk, metadata.targetFk];
  const extraColumnNames = Object.keys(metadata.columns);
  propertyNames.push(...extraColumnNames);

  if (metadata.timestamps) {
    propertyNames.push('created_at', 'updated_at');
  }
  if (metadata.softDeletes) {
    propertyNames.push('deleted_at');
  }

  // ─── Build MikroORM properties config ────────────────────────────────────────
  const properties: Record<string, any> = {
    // Primary key — UUID
    id: {
      type: 'string',
      primary: true,
      nullable: false,
    },
    // Source FK column — nullable when orphan mode is enabled
    [metadata.sourceFk]: {
      type: 'string',
      nullable: metadata.orphan,
    },
    // Target FK column
    [metadata.targetFk]: {
      type: 'string',
      nullable: false,
    },
  };

  // ─── Extra columns ───────────────────────────────────────────────────────────
  for (const [columnName, columnDef] of Object.entries(metadata.columns)) {
    properties[columnName] = buildColumnProperty(columnDef);
  }

  // ─── Timestamp columns ──────────────────────────────────────────────────────
  if (metadata.timestamps) {
    properties.created_at = {
      type: 'Date',
      columnType: 'timestamptz',
      nullable: false,
      defaultRaw: 'CURRENT_TIMESTAMP',
      onCreate: () => new Date(),
    };
    properties.updated_at = {
      type: 'Date',
      columnType: 'timestamptz',
      nullable: false,
      defaultRaw: 'CURRENT_TIMESTAMP',
      onCreate: () => new Date(),
      onUpdate: () => new Date(),
    };
  }

  // ─── Soft-delete column ─────────────────────────────────────────────────────
  if (metadata.softDeletes) {
    properties.deleted_at = {
      type: 'Date',
      columnType: 'timestamptz',
      nullable: true,
    };
  }

  // ─── Build indexes ──────────────────────────────────────────────────────────
  const indexes: any[] = [];

  // Unique constraint depends on cardinality
  if (metadata.cardinality === 'one-to-many') {
    // One-to-many: unique on targetFk (each target belongs to at most one source)
    indexes.push({
      properties: [metadata.targetFk],
      name: `IDX_${metadata.table}_${metadata.targetFk}_unique`,
      expression: metadata.softDeletes
        ? `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_${metadata.table}_${metadata.targetFk}_unique" ` +
          `ON "${metadata.table}" ("${metadata.targetFk}") ` +
          `WHERE deleted_at IS NULL`
        : metadata.orphan
          ? `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_${metadata.table}_${metadata.targetFk}_unique" ` +
            `ON "${metadata.table}" ("${metadata.targetFk}")`
          : undefined,
    });
  } else if (metadata.cardinality === 'one-to-one') {
    // One-to-one: unique on both FKs individually
    indexes.push({
      properties: [metadata.sourceFk],
      name: `IDX_${metadata.table}_${metadata.sourceFk}_unique`,
      expression: metadata.softDeletes
        ? `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_${metadata.table}_${metadata.sourceFk}_unique" ` +
          `ON "${metadata.table}" ("${metadata.sourceFk}") ` +
          `WHERE deleted_at IS NULL`
        : undefined,
    });
    indexes.push({
      properties: [metadata.targetFk],
      name: `IDX_${metadata.table}_${metadata.targetFk}_unique`,
      expression: metadata.softDeletes
        ? `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_${metadata.table}_${metadata.targetFk}_unique" ` +
          `ON "${metadata.table}" ("${metadata.targetFk}") ` +
          `WHERE deleted_at IS NULL`
        : undefined,
    });
  } else {
    // Many-to-many: composite unique on FK pair (prevents duplicate links)
    indexes.push({
      properties: [metadata.sourceFk, metadata.targetFk],
      name: `IDX_${metadata.table}_unique`,
      expression: metadata.softDeletes
        ? `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_${metadata.table}_unique" ` +
          `ON "${metadata.table}" ("${metadata.sourceFk}", "${metadata.targetFk}") ` +
          `WHERE deleted_at IS NULL`
        : undefined,
    });
  }

  // Index on source FK (for listBySource queries)
  indexes.push({
    properties: [metadata.sourceFk],
    name: `IDX_${metadata.table}_${metadata.sourceFk}`,
  });
  // Index on target FK (for listByTarget queries)
  indexes.push({
    properties: [metadata.targetFk],
    name: `IDX_${metadata.table}_${metadata.targetFk}`,
  });

  // Index on deleted_at for soft-delete queries
  if (metadata.softDeletes) {
    indexes.push({
      properties: ['deleted_at'],
      name: `IDX_${metadata.table}_deleted_at`,
    });
  }

  // Indexes on extra columns marked as indexed
  for (const [columnName, columnDef] of Object.entries(metadata.columns)) {
    if (columnDef.indexed) {
      indexes.push({
        properties: [columnName],
        name: `IDX_${metadata.table}_${columnName}`,
      });
    }
  }

  // ─── Build filters ──────────────────────────────────────────────────────────
  const filters: Record<string, any> = {};
  if (metadata.softDeletes) {
    filters.softDelete = {
      cond: { deleted_at: null },
      default: true,
    };
  }

  // ─── Build hooks ────────────────────────────────────────────────────────────
  const hooks: Record<string, any[]> = {};
  if (metadata.timestamps) {
    hooks.beforeUpdate = [
      (args: any) => {
        args.entity.updated_at = new Date();
      },
    ];
  }

  // ─── Create the EntitySchema ────────────────────────────────────────────────
  const entityName = `Link_${metadata.name}`;
  const ModelClass = createLinkModelClass(propertyNames);

  // Set the class name for debugging
  Object.defineProperty(ModelClass, 'name', { value: entityName });

  return new EntitySchema({
    class: ModelClass,
    name: entityName,
    tableName: metadata.table,
    properties,
    indexes,
    filters,
    hooks,
  });
}

/**
 * Converts a LinkColumnDefinition to a MikroORM property config.
 *
 * @param columnDef - The column definition from link options
 * @returns MikroORM property configuration object
 */
function buildColumnProperty(columnDef: ILinkColumnDefinition): Record<string, any> {
  const prop: Record<string, any> = {
    type: COLUMN_TYPE_MAP[columnDef.type] || 'string',
    nullable: columnDef.nullable ?? false,
  };

  // Handle default values
  if (columnDef.default !== undefined) {
    if (typeof columnDef.default === 'string' && columnDef.default.startsWith('raw:')) {
      // Raw SQL default (e.g., 'raw:CURRENT_TIMESTAMP')
      prop.defaultRaw = columnDef.default.slice(4);
    } else {
      prop.default = columnDef.default;
    }
  }

  // JSON columns use 'jsonb' column type in PostgreSQL
  if (columnDef.type === 'json') {
    prop.columnType = 'jsonb';
  }

  return prop;
}
