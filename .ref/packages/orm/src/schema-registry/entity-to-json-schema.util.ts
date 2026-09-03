/**
 * @file entity-to-json-schema.util.ts
 * @module @stackra/nestjs-orm/schema-registry
 * @description Generates JSON Schema (Draft 7) from @Entity/@Property decorator metadata.
 *   Used by the SchemaRegistryPopulator to expose entity shapes to the frontend
 *   for runtime validation, form generation, and type-aware operations.
 */

import { getMetadata } from '@vivtel/metadata';
import { PROPERTY_METADATA } from '../constants/metadata-keys.constant';
import type { StoredProperty } from '../interfaces/stored-property.interface';

// ============================================================================
// Type Mapping
// ============================================================================

/**
 * Maps ORM property types to JSON Schema type definitions.
 */
const JSON_SCHEMA_TYPE_MAP: Record<string, Record<string, unknown>> = {
  string: { type: 'string' },
  text: { type: 'string' },
  integer: { type: 'integer' },
  decimal: { type: 'number' },
  boolean: { type: 'boolean' },
  datetime: { type: 'string', format: 'date-time' },
  json: { type: 'object' },
  uuid: { type: 'string', format: 'uuid' },
  enum: { type: 'string' },
};

// ============================================================================
// Public API
// ============================================================================

/**
 * Generate a JSON Schema (Draft 7) object from an entity class's decorator metadata.
 *
 * Reads @Property metadata from the entity prototype and maps each property
 * to a JSON Schema property definition. Includes constraints (min, max,
 * minLength, maxLength, pattern, enum) and builds the `required` array from
 * non-nullable, non-optional properties.
 *
 * @param entityClass - The entity class to introspect
 * @returns A JSON Schema object describing the entity's writable fields
 *
 * @example
 * ```typescript
 * import { entityToJsonSchema } from './entity-to-json-schema.util';
 * import { Product } from './entities/product.entity';
 *
 * const schema = entityToJsonSchema(Product);
 * // {
 * //   $schema: 'http://json-schema.org/draft-07/schema#',
 * //   type: 'object',
 * //   properties: { name: { type: 'string' }, price: { type: 'number' } },
 * //   required: ['name', 'price'],
 * // }
 * ```
 */
export function entityToJsonSchema(entityClass: Function): Record<string, unknown> {
  const properties: StoredProperty[] =
    getMetadata<StoredProperty[]>(PROPERTY_METADATA, entityClass.prototype) ?? [];

  const jsonProperties: Record<string, Record<string, unknown>> = {};
  const required: string[] = [];

  for (const prop of properties) {
    // Skip primary keys — they are auto-generated, not user-provided
    if (prop.primary) continue;

    const fieldSchema = buildFieldSchema(prop);
    jsonProperties[prop.key] = fieldSchema;

    // Non-nullable properties without defaults are required
    if (!prop.nullable && prop.default === undefined && prop.defaultValue === undefined) {
      required.push(prop.key);
    }
  }

  return {
    $schema: 'http://json-schema.org/draft-07/schema#',
    type: 'object',
    properties: jsonProperties,
    required: required.length > 0 ? required : undefined,
    additionalProperties: false,
  };
}

// ============================================================================
// Private Helpers
// ============================================================================

/**
 * Build a JSON Schema property definition from a StoredProperty.
 *
 * @param prop - The stored property metadata
 * @returns JSON Schema property definition
 */
function buildFieldSchema(prop: StoredProperty): Record<string, unknown> {
  const propType = prop.type ?? 'string';
  const base = { ...(JSON_SCHEMA_TYPE_MAP[propType] ?? { type: 'string' }) };

  // Handle nullable — wrap with anyOf pattern
  if (prop.nullable) {
    const schema: Record<string, unknown> = {
      anyOf: [{ ...base, ...buildConstraints(prop) }, { type: 'null' }],
    };
    return schema;
  }

  // Apply constraints
  Object.assign(base, buildConstraints(prop));

  return base;
}

/**
 * Build constraint properties for a field (length, precision, enum values).
 *
 * @param prop - The stored property metadata
 * @returns Constraint properties for the JSON Schema
 */
function buildConstraints(prop: StoredProperty): Record<string, unknown> {
  const constraints: Record<string, unknown> = {};

  // String length constraints
  if (prop.length !== undefined) {
    constraints.maxLength = prop.length;
  }

  // Enum values
  if (prop.enum) {
    const enumObj = typeof prop.enum === 'function' ? prop.enum() : prop.enum;
    const values = Object.values(enumObj).filter((v) => typeof v === 'string');
    if (values.length > 0) {
      constraints.enum = values;
    }
  }

  // Default value
  if (prop.default !== undefined) {
    constraints.default = prop.default;
  } else if (prop.defaultValue !== undefined) {
    constraints.default = prop.defaultValue;
  }

  return constraints;
}
