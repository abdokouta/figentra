/**
 * @file has-many.decorator.ts
 * @description Decorator for one-to-many relationships.
 */

import { defineMetadata, getMetadata } from '@vivtel/metadata';
import { RELATION_METADATA } from '../relations/constants/relation-tokens.constant';
import { HasManyOptions, StoredRelation } from '../relations/interfaces/relation-options.interface';

/**
 * @HasMany() — declares a one-to-many relationship.
 *
 * @example
 * ```ts
 * @HasMany(() => Variant)
 * variants!: Variant[];
 * ```
 */
export function HasMany(target: () => any, options?: HasManyOptions): PropertyDecorator {
  return (proto: object, propertyKey: string | symbol) => {
    const existing: StoredRelation[] =
      getMetadata<StoredRelation[]>(RELATION_METADATA, proto) || [];
    existing.push({
      type: 'hasMany',
      propertyKey: String(propertyKey),
      target,
      options: options || {},
    });
    defineMetadata(RELATION_METADATA, existing, proto);
  };
}
