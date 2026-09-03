/**
 * @file many-to-many.decorator.ts
 * @description Decorator for many-to-many relationships.
 * Auto-generates pivot table when the link system scans entities.
 */

import { defineMetadata, getMetadata } from '@vivtel/metadata';
import { RELATION_METADATA } from '../relations/constants/relation-tokens.constant';
import {
  ManyToManyOptions,
  StoredRelation,
} from '../relations/interfaces/relation-options.interface';

/**
 * @ManyToMany() — declares a many-to-many relationship.
 * The link system auto-generates the pivot table and schema.
 *
 * @param target - Factory function returning the related entity class
 * @param options - Pivot table configuration
 *
 * @example
 * ```ts
 * @ManyToMany(() => SalesChannel, { pivotColumns: { sortOrder: 'integer' } })
 * salesChannels!: SalesChannel[];
 * ```
 */
export function ManyToMany(target: () => any, options?: ManyToManyOptions): PropertyDecorator {
  return (proto: object, propertyKey: string | symbol) => {
    const existing: StoredRelation[] =
      getMetadata<StoredRelation[]>(RELATION_METADATA, proto) || [];
    existing.push({
      type: 'manyToMany',
      propertyKey: String(propertyKey),
      target,
      options: options || {},
    });
    defineMetadata(RELATION_METADATA, existing, proto);
  };
}
