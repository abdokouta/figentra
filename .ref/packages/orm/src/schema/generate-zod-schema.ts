/**
 * @file generate-zod-schema.ts
 * @module @stackra/nestjs-orm/schema
 * @description Auto-generates Zod validation schemas from entity @Property() metadata.
 *   Produces base, create, update, and filter schemas — shareable across API/web/native.
 */

import { z, type ZodTypeAny, type ZodObject } from 'zod';
import { getProperties } from '../utils/get-properties.util';

// ============================================================================
// Types
// ============================================================================

// ============================================================================
// Field names to exclude from create/update schemas
// ============================================================================

const SYSTEM_FIELDS = new Set([
  'id',
  'createdAt',
  'updatedAt',
  'deletedAt',
  'deletedBy',
  'createdBy',
  'updatedBy',
  'version',
  'archivedAt',
  'archivedBy',
  'publishedAt',
  'publishedBy',
  'owner_id', // Auto-populated from scope context
  'scope_node_id', // Auto-populated from scope context
]);

// ============================================================================
// Public API
// ============================================================================

/**
 * Generate Zod schemas from entity @Property() metadata.
 *
 * Reads all property definitions and maps them to Zod types.
 * Returns base (full), create (input), update (partial input), and filter schemas.
 *
 * @param entityClass - The entity class with @Property() decorators
 * @returns Generated schema set
 *
 * @example
 * ```typescript
 * import { generateZodSchemas } from '@stackra/nestjs-orm';
 * import { Product } from './entities';
 *
 * const { create, update, filter } = generateZodSchemas(Product);
 *
 * // Use in controller:
 * @Post()
 * @UsePipes(new ZodValidationPipe(create))
 * async createProduct(@Body() data: z.infer<typeof create>) { ... }
 *
 * // Share with frontend:
 * export { create as CreateProductSchema } from './schemas';
 * ```
 */
export function generateZodSchemas(entityClass: Function): IGeneratedSchemas {
  const properties = getProperties(entityClass);
  const shape: Record<string, ZodTypeAny> = {};
  const filterShape: Record<string, ZodTypeAny> = {};

  for (const prop of properties) {
    const zodType = mapPropertyToZod(prop);
    shape[prop.key] = zodType;

    // Add to filter (all optional)
    if (isFilterable(prop)) {
      filterShape[prop.key] = zodType.optional();
    }
  }

  const base = z.object(shape);

  // Create: exclude system/computed fields
  const createShape: Record<string, ZodTypeAny> = {};
  for (const [key, value] of Object.entries(shape)) {
    if (!SYSTEM_FIELDS.has(key)) {
      createShape[key] = value;
    }
  }
  const create = z.object(createShape);

  // Update: same as create but all optional
  const updateShape: Record<string, ZodTypeAny> = {};
  for (const [key, value] of Object.entries(createShape)) {
    updateShape[key] = value.optional();
  }
  const update = z.object(updateShape);

  // Filter: filterable fields, all optional
  const filter = z.object(filterShape);

  return { base, create, update, filter } as IGeneratedSchemas;
}

// ============================================================================
// Property → Zod Mapping
// ============================================================================

/**
 * Map a property definition to a Zod type.
 *
 * @param prop - Property metadata from @Property() decorator
 * @returns Corresponding Zod type
 */
function mapPropertyToZod(prop: any): ZodTypeAny {
  let schema: ZodTypeAny;

  switch (prop.type) {
    case 'string':
      schema = z.string();
      if (prop.length) schema = (schema as z.ZodString).max(prop.length);
      break;
    case 'text':
      schema = z.string();
      break;
    case 'integer':
      schema = z.number().int();
      break;
    case 'decimal':
      schema = z.number();
      break;
    case 'boolean':
      schema = z.boolean();
      break;
    case 'datetime':
      schema = z.coerce.date();
      break;
    case 'uuid':
      schema = z.string().uuid();
      break;
    case 'json':
      schema = z.record(z.string(), z.unknown());
      break;
    case 'enum':
      if (prop.enum) {
        const values = Object.values(prop.enum).filter((v): v is string => typeof v === 'string');
        schema = z.enum(values as [string, ...string[]]);
      } else {
        schema = z.string();
      }
      break;
    default:
      schema = z.string();
  }

  // Apply nullable
  if (prop.nullable) {
    schema = schema.nullable().optional();
  }

  return schema;
}

/**
 * Determine if a property is suitable for filtering.
 *
 * @param prop - Property metadata
 * @returns True if the field is filterable
 */
function isFilterable(prop: any): boolean {
  // Exclude text/json fields from filters (not efficient to filter on)
  if (prop.type === 'text' || prop.type === 'json') return false;
  // Include indexed fields, enums, booleans, and IDs
  if (prop.index || prop.type === 'enum' || prop.type === 'boolean' || prop.type === 'uuid')
    return true;
  // Include string fields with reasonable length
  if (prop.type === 'string' && (prop.length ?? 255) <= 255) return true;
  // Include numeric and datetime
  if (prop.type === 'integer' || prop.type === 'decimal' || prop.type === 'datetime') return true;
  return false;
}
