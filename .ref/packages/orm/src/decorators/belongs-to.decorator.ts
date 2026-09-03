/**
 * @file belongs-to.decorator.ts
 * @description Decorator for many-to-one (belongs-to) relationships.
 */

import { defineMetadata, getMetadata } from '@vivtel/metadata';
import { RELATION_METADATA } from '../relations/constants/relation-tokens.constant';
import {
  BelongsToOptions,
  StoredRelation,
} from '../relations/interfaces/relation-options.interface';

/**
 * @BelongsTo() — declares a many-to-one relationship.
 *
 * @example
 * ```ts
 * @BelongsTo(() => Category)
 * category!: Category;
 * ```
 */
export function BelongsTo(target: () => any, options?: BelongsToOptions): PropertyDecorator {
  return (proto: object, propertyKey: string | symbol) => {
    const existing: StoredRelation[] =
      getMetadata<StoredRelation[]>(RELATION_METADATA, proto) || [];
    existing.push({
      type: 'belongsTo',
      propertyKey: String(propertyKey),
      target,
      options: options || {},
    });
    defineMetadata(RELATION_METADATA, existing, proto);
  };
}
