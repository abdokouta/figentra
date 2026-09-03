/**
 * @file define-enum.ts
 * @description Factory to define a GraphQL-registered enum in one call.
 * Replaces the verbose pattern of declaring a TS enum + calling registerEnumType().
 */

import { registerEnumType } from '@nestjs/graphql';

/**
 * Options for individual enum values.
 */
export interface EnumValueOptions {
  /** Human-readable description for this value. */
  description?: string;
  /** Mark this value as deprecated in GraphQL schema. */
  deprecationReason?: string;
}

/**
 * Options for defineEnum().
 */
export interface DefineEnumOptions<T extends Record<string, string>> {
  /** Enum name in GraphQL schema. Auto-derived from keys if not provided. */
  name: string;
  /** Description for the enum type in GraphQL schema. */
  description?: string;
  /** Per-value descriptions and deprecation reasons. */
  valuesMap?: Partial<Record<keyof T, EnumValueOptions>>;
}

/**
 * Defines a TypeScript enum and registers it with GraphQL in one call.
 *
 * @param values - Object mapping enum keys to string values
 * @param options - GraphQL registration options (name, description, valuesMap)
 * @returns The enum object (usable as both TS type and runtime value)
 *
 * @example
 * ```ts
 * export const ArticleStatus = defineEnum(
 *   {
 *     DRAFT: 'draft',
 *     REVIEW: 'review',
 *     PUBLISHED: 'published',
 *     ARCHIVED: 'archived',
 *   },
 *   {
 *     name: 'ArticleStatus',
 *     description: 'Article publication status',
 *     valuesMap: {
 *       DRAFT: { description: 'Not yet published' },
 *       ARCHIVED: { description: 'No longer visible' },
 *     },
 *   },
 * );
 *
 * // Use as type:
 * status!: typeof ArticleStatus[keyof typeof ArticleStatus];
 *
 * // Use in @EnumProperty:
 * @EnumProperty(() => ArticleStatus, { default: ArticleStatus.DRAFT })
 * status!: string;
 * ```
 */
export function defineEnum<T extends Record<string, string>>(
  values: T,
  options: DefineEnumOptions<T>
): T {
  // Register with GraphQL
  registerEnumType(values, {
    name: options.name,
    description: options.description,
    valuesMap: options.valuesMap as any,
  });

  // Freeze to prevent mutation
  return Object.freeze(values);
}
