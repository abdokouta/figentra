/**
 * @file zod-validation.pipe.ts
 * @module @stackra/nestjs-orm/http/pipes
 * @description NestJS pipe that validates request body/params against a Zod schema.
 *   Replaces class-validator + ValidationPipe for DTO validation.
 *
 *   When registered globally (via APP_PIPE), it validates only when:
 *   1. The pipe was instantiated with a schema (parameter-level usage), OR
 *   2. The parameter's metatype has a static `schema` property (class-level convention).
 *   Otherwise, the value passes through without validation.
 */

import {
  type PipeTransform,
  type ArgumentMetadata,
  BadRequestException,
  IInjectable,
} from '@nestjs/common';
import type { ZodSchema, ZodError } from 'zod';

// ============================================================================
// Pipe
// ============================================================================

/**
 * Zod validation pipe for NestJS controllers.
 *
 * Validates incoming request data against a Zod schema. On failure,
 * throws a BadRequestException with structured field errors.
 *
 * Supports two modes:
 * - **Explicit**: Instantiated with a schema (e.g., `@Body(new ZodValidationPipe(schema))`)
 * - **Implicit**: Registered globally; validates only if the parameter's metatype
 *   exposes a static `schema` property.
 *
 * @example
 * ```typescript
 * // Explicit usage (parameter-level):
 * @Post()
 * async createProduct(
 *   @Body(new ZodValidationPipe(createSchema)) data: CreateProductDto
 * ) { ... }
 *
 * // Implicit usage (global pipe + class with static schema):
 * class CreateProductDto {
 *   static schema = z.object({ name: z.string(), price: z.number() });
 * }
 *
 * @Post()
 * async createProduct(@Body() data: CreateProductDto) { ... }
 * ```
 */
@IInjectable()
export class ZodValidationPipe implements PipeTransform {
  private readonly schema: ZodSchema | null;

  /**
   * @param schema - Optional Zod schema to validate against. When omitted (global mode),
   *   the pipe checks the parameter's metatype for a static `schema` property.
   */
  public constructor(schema?: ZodSchema) {
    this.schema = schema ?? null;
  }

  /**
   * Transform and validate the input value.
   *
   * If the pipe was instantiated with a schema, validates against it.
   * If the parameter's metatype has a static `schema` property, validates against that.
   * Otherwise, passes the value through without validation.
   *
   * @param value - Raw input data
   * @param metadata - NestJS argument metadata (type, metatype, data)
   * @returns Parsed and validated data, or the original value if no schema applies
   * @throws BadRequestException with field errors on validation failure
   */
  public transform(value: unknown, metadata?: ArgumentMetadata): unknown {
    // If pipe was instantiated with a schema, use it
    if (this.schema) {
      return this.validate(value, this.schema);
    }

    // If the parameter type has a static schema property, use that
    const metatype = metadata?.metatype as any;
    if (metatype?.schema) {
      return this.validate(value, metatype.schema);
    }

    // No schema — passthrough
    return value;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Private
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Validate a value against a Zod schema.
   *
   * @param value - Raw input data
   * @param schema - Zod schema to validate against
   * @returns Parsed and validated data
   * @throws BadRequestException with field errors on validation failure
   */
  private validate(value: unknown, schema: ZodSchema): unknown {
    const result = schema.safeParse(value);

    if (!result.success) {
      const fieldErrors = formatZodErrors(result.error);

      throw new BadRequestException({
        message: 'Validation failed',
        errors: fieldErrors,
      });
    }

    return result.data;
  }
}

// ============================================================================
// Error Formatting
// ============================================================================

/**
 * Format Zod errors into a flat field → messages map.
 *
 * @param error - ZodError instance
 * @returns Map of field paths to error messages
 */
function formatZodErrors(error: ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const path = issue.path.join('.') || '_root';
    if (!fieldErrors[path]) {
      fieldErrors[path] = [];
    }
    fieldErrors[path].push(issue.message);
  }

  return fieldErrors;
}
