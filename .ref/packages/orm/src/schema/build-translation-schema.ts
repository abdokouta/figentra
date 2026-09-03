/**
 * @file build-translation-schema.ts
 * @description Generates a MikroORM EntitySchema for the translations table of an entity.
 */

import { getMetadata } from '@vivtel/metadata';
import { defineEntity } from '@mikro-orm/core';
import { getTranslatableFields } from '../decorators/translatable.decorator';
import { ENTITY_METADATA } from '../constants/metadata-keys.constant';

/**
 * Generates a translations table schema for an entity that has @Translatable() fields.
 *
 * @param entityClass - The entity class with @Translatable() fields
 * @returns The MikroORM entitySchema for the translations table, or null if no translatable fields
 *
 * @example
 * ```ts
 * const ProductTranslationSchema = buildTranslationSchema(Product);
 * // Creates: product_translations (id, product_id, locale, name, description)
 * ```
 */
export function buildTranslationSchema(entityClass: Function): any | null {
  const fields = getTranslatableFields(entityClass);
  if (fields.length === 0) return null;

  const entityMeta = getMetadata(ENTITY_METADATA, entityClass);
  const entityName = entityMeta?.name || entityClass.name;
  const tableName = entityMeta?.tableName || entityName.toLowerCase() + 's';
  const translationTableName = `${tableName.replace(/s$/, '')}_translations`;
  const fkColumn = `${entityName.toLowerCase()}_id`;

  return defineEntity({
    name: `${entityName}Translation`,
    tableName: translationTableName,
    properties: (p: any) => {
      const props: Record<string, any> = {
        id: p.uuid().primary(),
        [fkColumn]: p.string().index(),
        locale: p.string().length(10).index(),
      };

      // Add all translatable fields as string columns
      for (const field of fields) {
        props[field.propertyKey] = p.string().nullable();
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
}
