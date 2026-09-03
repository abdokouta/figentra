/**
 * @file translatable.decorator.ts
 * @description Property decorator that marks a field as translatable.
 * Thin wrapper over @Stored() with locale partitioning.
 *
 * Supports three storage strategies:
 * - `table` (default): Stored in `{entity}_translations` satellite table.
 * - `json`: Stored as a JSON column on the entity itself (`{ en: "...", ar: "..." }`).
 * - `pivot`: Stored in shared `entity_translations` polymorphic table.
 */

import { getMetadata } from '@vivtel/metadata';
import { Stored, StorageStrategy, StoredField, STORED_METADATA } from './stored.decorator';

/**
 * @Translatable() — marks a property as translatable.
 * Sugar over @Stored() with `suffix: 'translations'` and `partitionBy: 'locale'`.
 *
 * @param options - Translation options (strategy: 'table' | 'json' | 'pivot')
 *
 * @example
 * ```ts
 * // Separate table (default) — stored in post_translations
 * @Translatable()
 * title!: string;
 *
 * // JSON column — stored as { en: "...", ar: "..." } on the entity itself
 * @Translatable({ strategy: 'json' })
 * bio!: Record<string, string>;
 *
 * // Shared polymorphic table — stored in entity_translations
 * @Translatable({ strategy: 'pivot' })
 * tagline!: string;
 * ```
 */
export function Translatable(options?: TranslatableOptions): PropertyDecorator {
  const strategy = options?.strategy || 'table';

  return Stored({
    strategy,
    suffix: 'translations',
    partitionBy: 'locale',
    nullable: true,
  });
}

/**
 * Reads all translatable fields from an entity class.
 */
export function getTranslatableFields(entityClass: Function): TranslatableField[] {
  const stored: StoredField[] =
    getMetadata<StoredField[]>(STORED_METADATA, entityClass.prototype) || [];
  return stored
    .filter((f) => f.suffix === 'translations')
    .map((f) => ({ propertyKey: f.propertyKey, strategy: f.strategy }));
}

/**
 * Reads translatable fields filtered by strategy.
 */
export function getTranslatableFieldsByStrategy(
  entityClass: Function,
  strategy: StorageStrategy
): TranslatableField[] {
  return getTranslatableFields(entityClass).filter((f) => f.strategy === strategy);
}
