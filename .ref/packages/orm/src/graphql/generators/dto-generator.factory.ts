/**
 * @file dto-generator.factory.ts
 * @module @stackra/nestjs-orm/graphql/generators
 * @description Auto-generates CreateInput, UpdateInput, FilterInput, and SortInput
 *   DTO classes from entity decorator metadata.
 *
 *   Eliminates manual DTO creation for simple entities. Applies `@InputType()`
 *   and `@Field()` decorators to the generated classes for GraphQL schema.
 *
 *   ## Usage
 *
 *   ```typescript
 *   import { generateDtos } from '@stackra/nestjs-orm/graphql';
 *   const { CreateInput, UpdateInput, FilterInput, SortInput } = generateDtos(Product);
 *   ```
 */

import { InputType, Field, ID } from '@nestjs/graphql';
import { collectProperties } from '../../utils/collect-properties.util';
import { resolveGraphQLType } from '../../utils/resolve-graphql-type.util';
import type { StoredProperty } from '../../interfaces';

// ============================================================================
// Types
// ============================================================================

// ============================================================================
// Generator
// ============================================================================

/**
 * Auto-generate GraphQL DTO classes from entity decorator metadata.
 *
 * Reads `@Property()` metadata from the entity's prototype chain and
 * produces four DTO classes suitable for CRUD operations.
 *
 * @param entity - The decorated entity class.
 * @returns Generated DTO classes with GraphQL decorators applied.
 *
 * @example
 * ```typescript
 * const dtos = generateDtos(Product);
 * // dtos.CreateInput has: name (required), description (optional), price (required)
 * // dtos.UpdateInput has: id (required), name?, description?, price?
 * // dtos.FilterInput has: name { eq, contains, in }, price { gt, lt, gte, lte }
 * // dtos.SortInput has: name (ASC/DESC), price (ASC/DESC), createdAt (ASC/DESC)
 * ```
 */
export function generateDtos(entity: Function): GeneratedDtos {
  const entityName = entity.name;
  const properties = collectProperties(entity);

  // ── Determine which fields go in CreateInput ────────────────────────────
  const createFields = properties.filter(
    (p) => !p.primary && !p.onCreate && !p.onUpdate && !p.version && p.key !== 'id'
  );

  // ── Determine which fields are filterable/sortable ──────────────────────
  const allFields = properties.filter((p) => !p.primary && p.key !== 'id');

  // ── Build CreateInput ──────────────────────────────────────────────────
  const CreateInput = buildDtoClass(`Create${entityName}Input`, createFields, false);

  // ── Build UpdateInput (all fields optional + id required) ──────────────
  const UpdateInput = buildDtoClass(`Update${entityName}Input`, allFields, true);

  // ── Build FilterInput ──────────────────────────────────────────────────
  const FilterInput = buildFilterDtoClass(`${entityName}FilterInput`, allFields);

  // ── Build SortInput ────────────────────────────────────────────────────
  const SortInput = buildSortDtoClass(`${entityName}SortInput`, allFields);

  return { CreateInput, UpdateInput, FilterInput, SortInput };
}

// ============================================================================
// Internal Builders
// ============================================================================

/**
 * Build a DTO class with fields from property metadata.
 */
function buildDtoClass(className: string, fields: StoredProperty[], allOptional: boolean): any {
  const DtoClass = { [className]: class {} }[className]!;

  for (const field of fields) {
    Object.defineProperty(DtoClass.prototype, field.key, {
      writable: true,
      enumerable: true,
      configurable: true,
    });
  }

  InputType(className)(DtoClass);

  // Add `id` field for UpdateInput
  if (allOptional) {
    Field(() => ID)(DtoClass.prototype, 'id');
  }

  for (const field of fields) {
    const gqlType = resolveGraphQLType(field.type);
    const nullable = allOptional || (field.nullable ?? false);
    Field(() => gqlType, { nullable })(DtoClass.prototype, field.key);
  }

  return DtoClass;
}

/**
 * Build a filter DTO class with operators per field.
 */
function buildFilterDtoClass(className: string, fields: StoredProperty[]): any {
  const FilterClass = { [className]: class {} }[className]!;
  InputType(className)(FilterClass);

  for (const field of fields) {
    const gqlType = resolveGraphQLType('json');
    Field(() => gqlType, { nullable: true, description: `Filter by ${field.key}` })(
      FilterClass.prototype,
      field.key
    );
  }

  return FilterClass;
}

/**
 * Build a sort DTO class with direction per field.
 */
function buildSortDtoClass(className: string, fields: StoredProperty[]): any {
  const SortClass = { [className]: class {} }[className]!;
  InputType(className)(SortClass);

  for (const field of fields) {
    Field(() => String, { nullable: true, description: `Sort by ${field.key} (ASC/DESC)` })(
      SortClass.prototype,
      field.key
    );
  }

  return SortClass;
}
