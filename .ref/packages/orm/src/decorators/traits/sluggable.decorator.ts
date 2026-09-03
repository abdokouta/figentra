/**
 * @file sluggable.decorator.ts
 * @module @stackra/nestjs-orm/decorators/traits
 * @description @Sluggable() trait — auto-generates URL-safe slugs from source field(s).
 *
 *   Adds a `slug` field (unique, indexed) and auto-generates on create.
 *   Handles duplicates by appending -1, -2, etc. when `unique: true`.
 */

import { defineMetadata, getMetadata } from '@vivtel/metadata';
import { addProperty } from '../../utils/add-property.util';
import { addTrait } from '../../utils/add-trait.util';

// ============================================================================
// Constants
// ============================================================================

// ============================================================================
// Types
// ============================================================================

// ============================================================================
// Decorator
// ============================================================================

/**
 * Auto-generate URL-safe slugs from entity field(s).
 *
 * Adds a `slug` property (string, unique, indexed) and auto-generates
 * it on create from the specified source field(s).
 *
 * @param config - Slug generation configuration
 * @returns Class decorator
 *
 * @example
 * ```typescript
 * @Entity({ tableName: 'products' })
 * @Timestamps()
 * @Sluggable({ from: 'name' })
 * export class Product extends BaseEntity {
 *   @Property()
 *   name!: string;
 *   // slug field auto-added: unique, indexed
 * }
 *
 * @Sluggable({ from: ['first_name', 'last_name'], separator: '-' })
 * export class Player extends BaseEntity { ... }
 * ```
 */
export function Sluggable(config: ISluggableConfig): ClassDecorator {
  return (target: Function) => {
    const fieldName = config.field ?? 'slug';
    const resolvedConfig: Required<ISluggableConfig> = {
      from: config.from,
      separator: config.separator ?? '-',
      unique: config.unique ?? true,
      regenerateOnUpdate: config.regenerateOnUpdate ?? false,
      field: fieldName,
      maxLength: config.maxLength ?? 255,
    };

    // Store config in metadata
    defineMetadata(SLUGGABLE_METADATA_KEY, resolvedConfig, target);

    // Add the slug property to the entity schema
    addProperty(target.prototype, fieldName, {
      type: 'string',
      unique: resolvedConfig.unique,
      index: true,
      length: resolvedConfig.maxLength,
    });

    // Register the trait
    addTrait(target.prototype, 'sluggable');
  };
}

// ============================================================================
// Utility
// ============================================================================

/**
 * Generate a URL-safe slug from a source string.
 *
 * @param source - The source text to slugify
 * @param separator - Word separator (default: '-')
 * @returns URL-safe slug
 */
export function generateSlug(source: string, separator: string = '-'): string {
  return source
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove non-alphanumeric
    .replace(/[\s_]+/g, separator) // Replace spaces/underscores with separator
    .replace(new RegExp(`${separator}+`, 'g'), separator) // Collapse multiple separators
    .replace(new RegExp(`^${separator}|${separator}$`, 'g'), ''); // Trim separators
}

/**
 * Get the @Sluggable() config from an entity class.
 *
 * @param target - Entity class
 * @returns Sluggable config or undefined
 */
export function getSluggableConfig(target: Function): Required<ISluggableConfig> | undefined {
  return getMetadata<Required<ISluggableConfig>>(SLUGGABLE_METADATA_KEY, target);
}
