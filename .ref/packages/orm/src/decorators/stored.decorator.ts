/**
 * @file stored.decorator.ts
 * @description Property decorator that defines WHERE a field's data lives.
 *
 * NOTE: This file uses `@vivtel/metadata` for metadata operations,
 * consistent with the rest of the ORM package.
 *
 * Storage strategies:
 * - `json`: Stored as a JSON column on the entity's own table. No @Property() needed.
 * - `table`: Stored in a dedicated satellite table: `{entity}_{suffix}`.
 * - `pivot`: Stored in a shared polymorphic table: `entity_{suffix}`.
 *
 * @example
 * ```ts
 * // JSON column on the entity table
 * @Stored({ strategy: 'json' })
 * seo!: Record<string, string>;
 *
 * // Dedicated satellite table: post_translations
 * @Stored({ strategy: 'table', suffix: 'translations', partitionBy: 'locale' })
 * title!: string;
 *
 * // Shared polymorphic table: entity_translations
 * @Stored({ strategy: 'pivot', suffix: 'translations', partitionBy: 'locale' })
 * body!: string;
 *
 * // Satellite table for reactions: post_reactions
 * @Stored({ strategy: 'table', suffix: 'reactions' })
 * likes!: number;
 * ```
 */

import { defineMetadata, getMetadata } from '@vivtel/metadata';
import { Field, Int, Float } from '@nestjs/graphql';
import { addProperty } from '../utils/add-property.util';
import { resolveGraphQLType } from '../utils/resolve-graphql-type.util';

/** Metadata key for stored fields. */
export const STORED_METADATA = Symbol('orm:stored');

/**
 * @Stored() — marks a property with an external storage strategy.
 *
 * For `json` strategy: registers a JSON column on the entity table (no @Property needed).
 * For `table`/`pivot` strategy: the field is NOT on the main table — it lives in a satellite.
 */
export function Stored(options: StoredOptions): PropertyDecorator {
  return (target: any, propertyKey: string | symbol) => {
    const key = String(propertyKey);

    // Store metadata for defineSchema() to read
    const existing: StoredField[] = getMetadata<StoredField[]>(STORED_METADATA, target) || [];
    existing.push({
      propertyKey: key,
      strategy: options.strategy,
      suffix: options.suffix || 'data',
      partitionBy: options.partitionBy,
      type: options.type,
      nullable: options.nullable,
    });
    defineMetadata(STORED_METADATA, existing, target);

    // For JSON strategy: also register as a property on the main table
    if (options.strategy === 'json') {
      addProperty(target, {
        key,
        type: 'json',
        nullable: options.nullable,
      });

      // Register GraphQL field
      const gqlType = resolveGraphQLType('json');
      Field(() => gqlType, { nullable: options.nullable ?? false })(target, propertyKey);
    } else {
      // For table/pivot: register GraphQL field but NOT a DB property
      // (the field lives in the satellite table, not the main table)
      let gqlType: any = String;
      if (options.type === 'integer') gqlType = Int;
      else if (options.type === 'decimal') gqlType = Float;
      else if (options.type === 'boolean') gqlType = Boolean;
      else if (options.type === 'datetime') gqlType = Date;
      Field(() => gqlType, { nullable: options.nullable ?? false })(target, propertyKey);
    }
  };
}

/**
 * Reads all stored fields from an entity class.
 */
export function getStoredFields(entityClass: Function): StoredField[] {
  return getMetadata<StoredField[]>(STORED_METADATA, entityClass.prototype) || [];
}

/**
 * Reads stored fields filtered by strategy.
 */
export function getStoredFieldsByStrategy(
  entityClass: Function,
  strategy: StorageStrategy
): StoredField[] {
  return getStoredFields(entityClass).filter((f) => f.strategy === strategy);
}

/**
 * Reads stored fields filtered by suffix (group).
 */
export function getStoredFieldsBySuffix(entityClass: Function, suffix: string): StoredField[] {
  return getStoredFields(entityClass).filter((f) => f.suffix === suffix);
}

/**
 * Gets unique suffixes used across all stored fields for an entity.
 */
export function getStoredSuffixes(entityClass: Function): string[] {
  const fields = getStoredFields(entityClass);
  return [...new Set(fields.map((f) => f.suffix))];
}
