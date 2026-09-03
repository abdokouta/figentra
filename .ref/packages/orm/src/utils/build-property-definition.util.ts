/**
 * @file build-property-definition.util.ts
 * @description Converts a StoredProperty into a MikroORM v7 property builder chain.
 */

import { StoredProperty } from '../interfaces/stored-property.interface';

/**
 * Converts a StoredProperty into a MikroORM defineEntity property builder.
 *
 * @param p - The MikroORM property builder object (from defineEntity callback)
 * @param prop - The stored property metadata
 * @returns A MikroORM property builder chain
 */
export function buildPropertyDefinition(p: any, prop: StoredProperty): any {
  let builder: any;

  switch (prop.type) {
    case 'uuid':
      builder = p.uuid();
      break;
    case 'string':
      builder = p.string();
      break;
    case 'text':
      builder = p.text();
      break;
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
    case 'enum':
      builder = p.enum(prop.enum);
      break;
    default:
      builder = p.string();
      break;
  }

  if (prop.primary) builder = builder.primary();
  if (prop.unique) builder = builder.unique();
  if (prop.nullable) builder = builder.nullable();
  if (prop.index) builder = builder.index();
  if (prop.version) builder = builder.version();
  if (prop.default !== undefined) builder = builder.default(prop.default);
  if (prop.defaultValue !== undefined) builder = builder.default(prop.defaultValue);
  if (prop.onCreate) builder = builder.onCreate(prop.onCreate);
  if (prop.onUpdate) builder = builder.onUpdate(prop.onUpdate);
  if (prop.length) builder = builder.length(prop.length);
  if (prop.precision) builder = builder.precision(prop.precision);
  if (prop.scale) builder = builder.scale(prop.scale);

  return builder;
}
