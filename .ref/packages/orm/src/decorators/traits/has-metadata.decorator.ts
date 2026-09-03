/**
 * @file has-metadata.decorator.ts
 * @module @stackra/nestjs-orm/decorators/traits
 * @description @HasMetadata() trait — adds public and private JSON metadata columns.
 *
 *   Adds `metadata` (public, exposed in API) and `private_metadata` (internal only)
 *   as jsonb columns with empty object defaults.
 */

import { defineMetadata } from '@vivtel/metadata';
import { addProperty } from '../../utils/add-property.util';
import { addTrait } from '../../utils/add-trait.util';

// ============================================================================
// Constants
// ============================================================================

// ============================================================================
// Decorator
// ============================================================================

/**
 * Add extensible metadata columns (public + private) to an entity.
 *
 * Adds two jsonb columns:
 * - `metadata` — public, exposed in API responses (extensible by integrations)
 * - `private_metadata` — internal only, never exposed in API responses
 *
 * @returns Class decorator
 *
 * @example
 * ```typescript
 * @Entity({ tableName: 'products' })
 * @Timestamps()
 * @HasMetadata()
 * export class Product extends BaseEntity {
 *   @Property()
 *   name!: string;
 *   // metadata and private_metadata auto-added
 * }
 *
 * // Usage:
 * product.metadata = { color: 'red', customField: 'value' };
 * product.private_metadata = { internalScore: 42 };
 * ```
 */
export function HasMetadata(): ClassDecorator {
  return (target: Function) => {
    defineMetadata(HAS_METADATA_KEY, true, target);

    // Add public metadata column
    addProperty(target.prototype, 'metadata', {
      type: 'json',
      nullable: false,
      default: '{}',
    });

    // Add private metadata column (never exposed in GraphQL/REST by default)
    addProperty(target.prototype, 'private_metadata', {
      type: 'json',
      nullable: false,
      default: '{}',
    });

    addTrait(target.prototype, 'hasMetadata');
  };
}
