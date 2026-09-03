/**
 * @file has-one.decorator.ts
 * @module @stackra/nestjs-orm/decorators
 * @description Decorator for defining a one-to-one "has one" relationship
 *   (the inverse owns the FK). Registers relation metadata for schema generation,
 *   DataLoader batching, and GraphQL auto-resolution.
 */

import { defineMetadata, getMetadata } from '@vivtel/metadata';

import { RELATION_METADATA } from '../relations';
import type { StoredRelation, HasOneOptions } from '../relations';

// ============================================================================
// Re-export for convenience
// ============================================================================

export type { HasOneOptions } from '../relations';

// ============================================================================
// Decorator
// ============================================================================

/**
 * Define a one-to-one "has one" relationship on an entity property.
 *
 * The parent entity owns zero or one related entity. The FK lives on the
 * related (inverse) entity's table. This produces a MikroORM `OneToOne`
 * relationship and registers with the DataLoader system for batched resolution.
 *
 * @param target - Factory function returning the related entity class
 * @param options - Relationship options (foreignKey, eager)
 * @returns Property decorator
 *
 * @example
 * ```typescript
 * @Entity({ tableName: 'users' })
 * export class User extends BaseEntity {
 *   @HasOne(() => Profile, { foreignKey: 'userId' })
 *   profile!: Profile;
 * }
 * ```
 */
export function HasOne(target: () => any, options?: HasOneOptions): PropertyDecorator {
  return (proto: Object, propertyKey: string | symbol) => {
    const constructor = proto.constructor;
    const existing: StoredRelation[] =
      getMetadata<StoredRelation[]>(RELATION_METADATA, constructor) || [];

    existing.push({
      type: 'hasOne',
      propertyKey: String(propertyKey),
      target,
      options: options || {},
    });

    defineMetadata(RELATION_METADATA, existing, constructor);
  };
}
