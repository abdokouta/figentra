/**
 * @file searchable.decorator.ts
 * @module @stackra/nestjs-orm/decorators/traits
 * @description @Searchable() trait — marks entity fields for full-text search indexing.
 *
 *   Metadata-only decorator. No columns added. Consumed by the search/indexer
 *   infrastructure to determine which fields to index and their relative weights.
 */

import { defineMetadata } from '@vivtel/metadata';
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
 * Mark entity fields for full-text search indexing.
 *
 * This is metadata-only — no database columns are added. The search
 * infrastructure (`@stackra/nestjs-indexer`) reads this metadata to
 * determine what to index and with what relevance weights.
 *
 * @param config - Search indexing configuration
 * @returns Class decorator
 *
 * @example
 * ```typescript
 * @Entity({ tableName: 'products' })
 * @Timestamps()
 * @Searchable({ fields: ['name', 'description', 'sku'], weights: { name: 10, sku: 5 } })
 * export class Product extends BaseEntity {
 *   @Property()
 *   name!: string;
 *
 *   @Property({ type: 'text' })
 *   description!: string;
 *
 *   @Property()
 *   sku!: string;
 * }
 * ```
 */
export function Searchable(config: ISearchableConfig): ClassDecorator {
  return (target: Function) => {
    defineMetadata(SEARCHABLE_METADATA_KEY, config, target);
    addTrait(target.prototype, 'searchable');
  };
}
