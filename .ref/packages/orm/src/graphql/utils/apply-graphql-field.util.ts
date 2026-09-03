/**
 * @file apply-graphql-field.util.ts
 * @module @stackra/nestjs-orm/graphql/utils
 * @description Conditionally applies GraphQL `@Field()` decorator to a property.
 *
 *   Used by trait decorators and `@Stored()` to register GraphQL fields
 *   only when `@nestjs/graphql` is installed. Centralizes the conditional
 *   logic so each trait doesn't need its own detection check.
 */

import { isGraphQLAvailable } from './graphql-detection.util';
import { resolveGraphQLType } from '../../utils/resolve-graphql-type.util';

// ============================================================================
// Utility
// ============================================================================

/**
 * Conditionally apply `@Field()` from `@nestjs/graphql` to a property.
 *
 * No-op when GraphQL is not installed. Safe to call unconditionally.
 *
 * @param target - The class prototype.
 * @param propertyKey - The property name.
 * @param type - The GraphQL type (string name or constructor function).
 * @param options - GraphQL field options (nullable, description).
 */
export function applyGraphQLField(
  target: object,
  propertyKey: string,
  type: string | Function,
  options?: { nullable?: boolean; description?: string }
): void {
  if (!isGraphQLAvailable()) return;

  const { Field } = require('@nestjs/graphql');
  const gqlType = typeof type === 'function' ? type : resolveGraphQLType(type);
  Field(() => gqlType, {
    nullable: options?.nullable ?? false,
    description: options?.description,
  })(target, propertyKey);
}

/**
 * Conditionally apply `@Field(() => Int)` from `@nestjs/graphql` to a property.
 *
 * Convenience wrapper for integer fields.
 *
 * @param target - The class prototype.
 * @param propertyKey - The property name.
 * @param options - GraphQL field options (nullable, description).
 */
export function applyGraphQLIntField(
  target: object,
  propertyKey: string,
  options?: { nullable?: boolean; description?: string }
): void {
  if (!isGraphQLAvailable()) return;

  const { Field, Int } = require('@nestjs/graphql');
  Field(() => Int, {
    nullable: options?.nullable ?? false,
    description: options?.description,
  })(target, propertyKey);
}
