/**
 * @file build-schema.ts
 * @description Builds MikroORM v7 EntitySchemas from a decorated entity class.
 * Uses defineEntity() with proper OneToMany/ManyToOne relations for satellites.
 * Auto-applies entity filters based on traits.
 *
 * Satellite schemas (translations, reactions, etc.) are connected to the main
 * entity via native MikroORM relations — no custom routing needed.
 */

import { getMetadata } from '@vivtel/metadata';
import { defineEntity, Cascade } from '@mikro-orm/core';
import { ENTITY_METADATA, TRAIT_METADATA } from '../constants/metadata-keys.constant';
import { StoredEntityMeta } from '../interfaces/stored-entity-meta.interface';
import { collectProperties } from '../utils/collect-properties.util';
import { buildPropertyDefinition } from '../utils/build-property-definition.util';
import { softDeleteFilter } from '../entity-filters/soft-delete.filter';
import { notArchivedFilter } from '../entity-filters/not-archived.filter';
import { publishedFilter } from '../entity-filters/published.filter';
import { notExpiredFilter } from '../entity-filters/not-expired.filter';
import { getStoredFields, StoredField } from '../decorators/stored.decorator';

/**
 * Builds MikroORM EntitySchemas from a decorated entity class.
 *
 * @param entity - The decorated entity class (must have @Entity() applied)
 * @returns A schema object with `.satellites` map and backward-compat `.translationSchema`
 */
export function defineSchema(entity: Function): any {
  const entityMeta: StoredEntityMeta | undefined = getMetadata<StoredEntityMeta>(
    ENTITY_METADATA,
    entity
  );

  if (!entityMeta) {
    throw new Error(
      `[defineSchema] No @Entity() decorator found on "${entity.name}". Apply @Entity() first.`
    );
  }

  const entityName = entityMeta.name;

  // ─── Determine satellites FIRST (before creating main schema) ───────────────
  const storedFields = getStoredFields(entity);
  const tableFields = storedFields.filter((f) => f.strategy === 'table');

  // Group table-strategy fields by suffix
  const bySuffix = new Map<string, StoredField[]>();
  for (const field of tableFields) {
    const existing = bySuffix.get(field.suffix) || [];
    existing.push(field);
    bySuffix.set(field.suffix, existing);
  }

  // Pre-compute satellite metadata
  const satellitesMeta: Array<{
    suffix: string;
    entityName: string;
    tableName: string;
    fkColumn: string;
    partitionBy?: string;
    fields: StoredField[];
    relationKey: string;
  }> = [];

  for (const [suffix, fields] of bySuffix) {
    const satEntityName = `${entityName}${capitalize(suffix.replace(/s$/, ''))}`;
    const satTableName = `${entityName.toLowerCase()}_${suffix}`;
    const fkColumn = `${entityName.toLowerCase()}_id`;
    const partitionBy = fields[0]?.partitionBy;
    const relationKey = suffix; // e.g. 'translations', 'reactions'

    satellitesMeta.push({
      suffix,
      entityName: satEntityName,
      tableName: satTableName,
      fkColumn,
      partitionBy,
      fields,
      relationKey,
    });
  }

  // ─── Read traits for entity filters ─────────────────────────────────────────
  const traits: string[] = getMetadata<string[]>(TRAIT_METADATA, entity.prototype) || [];
  const filters: Record<string, any> = {};

  if (traits.includes('softDeletes')) {
    filters[softDeleteFilter.name] = {
      cond: softDeleteFilter.cond,
      default: softDeleteFilter.default,
    };
  }
  if (traits.includes('archivable')) {
    filters[notArchivedFilter.name] = {
      cond: notArchivedFilter.cond,
      default: notArchivedFilter.default,
    };
  }
  if (traits.includes('publishable')) {
    filters[publishedFilter.name] = {
      cond: publishedFilter.cond,
      default: publishedFilter.default,
    };
  }
  if (traits.includes('expirable')) {
    filters[notExpiredFilter.name] = {
      cond: notExpiredFilter.cond,
      default: notExpiredFilter.default,
    };
  }

  // ─── Collect main entity properties ─────────────────────────────────────────
  const properties = collectProperties(entity);

  // ─── Create satellite schemas FIRST (main schema references them) ───────────
  const satelliteSchemas: Record<string, any> = {};

  for (const sat of satellitesMeta) {
    // We'll create a placeholder that the main schema can reference
    // Then define the full satellite after
    satelliteSchemas[sat.suffix] = null; // placeholder
  }

  // ─── Create main entity schema ─────────────────────────────────────────────
  // We need to create satellites first so we can reference them in oneToMany
  // But satellites need to reference the main schema in manyToOne
  // Solution: create both in a two-pass approach using lazy references

  // Pass 1: Create main schema WITHOUT relations (we'll add them via metadata)
  const schema: any = defineEntity({
    name: entityMeta.name,
    tableName: entityMeta.tableName || entityMeta.name.toLowerCase() + 's',
    repository: entityMeta.repository,
    filters: Object.keys(filters).length > 0 ? filters : {},
    properties: (p: any) => {
      const props: Record<string, any> = {};
      for (const prop of properties) {
        props[prop.key] = buildPropertyDefinition(p, prop);
      }

      // Add OneToMany relations to satellites
      for (const sat of satellitesMeta) {
        props[sat.relationKey] = p
          .oneToMany(sat.entityName as any)
          .mappedBy(sat.fkColumn)
          .cascade([Cascade.ALL])
          .orphanRemoval(true);
      }

      return props;
    },
  });

  // Pass 2: Create satellite schemas with ManyToOne back to main
  for (const sat of satellitesMeta) {
    const satelliteSchema = defineEntity({
      name: sat.entityName,
      tableName: sat.tableName,
      properties: (p: any) => {
        const props: Record<string, any> = {
          id: p.uuid().primary(),
          [sat.fkColumn]: p.manyToOne(schema).joinColumn(sat.fkColumn).deleteRule('cascade'),
        };

        // Partition column (e.g. 'locale')
        if (sat.partitionBy) {
          props[sat.partitionBy] = p.string().length(10).index();
        }

        // Stored fields with proper types
        for (const field of sat.fields) {
          let builder: any;
          switch (field.type) {
            case 'integer':
              builder = p.integer();
              break;
            case 'decimal':
              builder = p.decimal();
              break;
            case 'boolean':
              builder = p.boolean();
              break;
            case 'datetime':
              builder = p.datetime();
              break;
            case 'json':
              builder = p.json();
              break;
            case 'text':
              builder = p.text();
              break;
            default:
              builder = p.string();
              break;
          }
          props[field.propertyKey] = builder.nullable();
        }

        // Timestamps
        props.createdAt = p.datetime().onCreate(() => new Date());
        props.updatedAt = p
          .datetime()
          .onCreate(() => new Date())
          .onUpdate(() => new Date());

        return props;
      },
    });

    satelliteSchemas[sat.suffix] = satelliteSchema;
  }

  // ─── Attach metadata to schema ─────────────────────────────────────────────
  schema.satellites = satelliteSchemas;

  // Register pivot fields for shared polymorphic tables
  const pivotFields = storedFields.filter((f) => f.strategy === 'pivot');
  schema.pivotFields = pivotFields.map((f) => ({
    ...f,
    entityType: entityMeta.name,
  }));

  // Backward compat
  schema.translationSchema = satelliteSchemas['translations'] || null;

  return schema;
}

/**
 * Collects all schemas (main + satellites + shared pivots) from multiple defineSchema results.
 * Automatically generates shared pivot table schemas for @Stored({ strategy: 'pivot' }) fields.
 */
export function collectSchemas(...schemas: any[]): any[] {
  const result: any[] = [];
  const pivotSuffixes = new Map<string, { partitionBy?: string }>();

  for (const schema of schemas) {
    result.push(schema);
    if (schema.satellites) {
      for (const satellite of Object.values(schema.satellites)) {
        if (satellite) result.push(satellite);
      }
    }
    if (schema.pivotFields) {
      for (const field of schema.pivotFields) {
        if (!pivotSuffixes.has(field.suffix)) {
          pivotSuffixes.set(field.suffix, { partitionBy: field.partitionBy });
        }
      }
    }
  }

  // Generate shared pivot table schemas
  for (const [suffix, opts] of pivotSuffixes) {
    result.push(generatePivotSchema(suffix, opts.partitionBy));
  }

  return result;
}

/**
 * Generates a shared polymorphic pivot table schema.
 */
function generatePivotSchema(suffix: string, partitionBy?: string): any {
  const tableName = `entity_${suffix}`;
  const schemaName = `EntityPivot${capitalize(suffix.replace(/s$/, ''))}`;

  return defineEntity({
    name: schemaName,
    tableName,
    properties: (p: any) => {
      const props: Record<string, any> = {
        id: p.uuid().primary(),
        entityType: p.string().index(),
        entityId: p.string().index(),
      };

      if (partitionBy) {
        props[partitionBy] = p.string().length(10).index();
      }

      props.field = p.string().index();
      props.value = p.text().nullable();
      props.createdAt = p.datetime().onCreate(() => new Date());
      props.updatedAt = p
        .datetime()
        .onCreate(() => new Date())
        .onUpdate(() => new Date());

      return props;
    },
  });
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
