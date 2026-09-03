/**
 * @file zod-to-openapi.util.ts
 * @module @stackra/nestjs-orm/http/utils
 * @description Converts Zod schemas to OpenAPI 3.x JSON Schema objects.
 *   Used by defineController() to auto-generate Swagger documentation.
 */

import type { ZodTypeAny, ZodObject } from 'zod';

/**
 * Convert a Zod schema to an OpenAPI-compatible JSON Schema object.
 *
 * @param schema - The Zod schema to convert
 * @returns An OpenAPI 3.x compatible JSON Schema object
 */
export function zodToOpenApi(schema: ZodTypeAny): Record<string, any> {
  // Handle ZodObject (most common case)
  if ((schema as any)._def?.typeName === 'ZodObject') {
    const shape = (schema as ZodObject<any>).shape;
    const properties: Record<string, any> = {};
    const required: string[] = [];

    for (const [key, value] of Object.entries(shape)) {
      properties[key] = zodTypeToOpenApi(value as ZodTypeAny);
      if (!isOptional(value as ZodTypeAny)) {
        required.push(key);
      }
    }

    return {
      type: 'object',
      properties,
      ...(required.length > 0 ? { required } : {}),
    };
  }

  return zodTypeToOpenApi(schema);
}

/**
 * Convert a single Zod type to its OpenAPI JSON Schema equivalent.
 *
 * @param schema - The Zod type to convert
 * @returns OpenAPI-compatible type definition
 */
function zodTypeToOpenApi(schema: ZodTypeAny): Record<string, any> {
  const def = (schema as any)._def as any;
  if (!def) return { type: 'string' };

  switch (def.typeName) {
    case 'ZodString':
      const strResult: any = { type: 'string' };
      for (const check of def.checks || []) {
        if (check.kind === 'max') strResult.maxLength = check.value;
        if (check.kind === 'min') strResult.minLength = check.value;
        if (check.kind === 'uuid') strResult.format = 'uuid';
        if (check.kind === 'email') strResult.format = 'email';
        if (check.kind === 'url') strResult.format = 'uri';
      }
      return strResult;
    case 'ZodNumber':
      const numResult: any = { type: 'number' };
      for (const check of def.checks || []) {
        if (check.kind === 'int') numResult.type = 'integer';
        if (check.kind === 'min') numResult.minimum = check.value;
        if (check.kind === 'max') numResult.maximum = check.value;
      }
      return numResult;
    case 'ZodBoolean':
      return { type: 'boolean' };
    case 'ZodDate':
      return { type: 'string', format: 'date-time' };
    case 'ZodEnum':
      return { type: 'string', enum: def.values };
    case 'ZodArray':
      return { type: 'array', items: zodTypeToOpenApi(def.type) };
    case 'ZodRecord':
      return { type: 'object', additionalProperties: true };
    case 'ZodNullable':
      return { ...zodTypeToOpenApi(def.innerType), nullable: true };
    case 'ZodOptional':
      return zodTypeToOpenApi(def.innerType);
    case 'ZodDefault':
      return { ...zodTypeToOpenApi(def.innerType), default: def.defaultValue() };
    default:
      return { type: 'string' };
  }
}

/**
 * Check if a Zod schema represents an optional field.
 *
 * @param schema - The Zod schema to check
 * @returns True if the schema is optional or nullable
 */
function isOptional(schema: ZodTypeAny): boolean {
  const def = (schema as any)._def as any;
  return def?.typeName === 'ZodOptional' || def?.typeName === 'ZodNullable';
}

/**
 * Generate a paginated response OpenAPI schema.
 *
 * @param itemSchema - The OpenAPI schema for individual items in the response
 * @returns OpenAPI schema describing the full paginated response envelope
 */
export function paginatedResponseSchema(itemSchema: Record<string, any>): Record<string, any> {
  return {
    type: 'object',
    properties: {
      data: { type: 'array', items: itemSchema },
      meta: {
        type: 'object',
        properties: {
          total: { type: 'integer' },
          page: { type: 'integer' },
          limit: { type: 'integer' },
          totalPages: { type: 'integer' },
          count: { type: 'integer' },
          hasNextPage: { type: 'boolean' },
          hasPreviousPage: { type: 'boolean' },
        },
      },
      links: {
        type: 'object',
        properties: {
          self: { type: 'string' },
          first: { type: 'string' },
          last: { type: 'string', nullable: true },
          next: { type: 'string', nullable: true },
          prev: { type: 'string', nullable: true },
        },
      },
    },
  };
}

/**
 * Generate an error response OpenAPI schema.
 *
 * @returns OpenAPI schema describing the standard error response envelope
 */
export function errorResponseSchema(): Record<string, any> {
  return {
    type: 'object',
    properties: {
      statusCode: { type: 'integer' },
      message: { type: 'string' },
      error: { type: 'string' },
      errors: {
        type: 'object',
        additionalProperties: { type: 'array', items: { type: 'string' } },
      },
      timestamp: { type: 'string', format: 'date-time' },
      path: { type: 'string' },
    },
  };
}
