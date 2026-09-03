/**
 * @file entity.decorator.ts
 * @description Class decorator that marks a class as an ORM entity.
 * Applies @ObjectType() for GraphQL and stores entity metadata for defineSchema().
 */

import { defineMetadata, getMetadata } from '@vivtel/metadata';
import { ObjectType } from '@nestjs/graphql';
import { ENTITY_METADATA, TRAIT_METADATA } from '../constants/metadata-keys.constant';
import { EntityOptions } from '../interfaces/entity-options.interface';
import { StoredEntityMeta } from '../interfaces/stored-entity-meta.interface';

/**
 * @Entity() decorator — marks a class as a domain entity.
 *
 * This decorator:
 * 1. Applies @ObjectType() so the class becomes a GraphQL type.
 * 2. Stores entity metadata that defineSchema() reads to generate MikroORM schema.
 *
 * @param options - Entity configuration (tableName, description)
 *
 * @example
 * ```ts
 * @Entity({ tableName: 'tenants' })
 * @Timestamps()
 * export class Tenant extends BaseEntity {
 *   @Property() name!: string;
 * }
 * ```
 */
export function Entity(options?: EntityOptions): ClassDecorator {
  return (target: Function) => {
    const traits: string[] = getMetadata<string[]>(TRAIT_METADATA, target.prototype) || [];

    const meta: StoredEntityMeta = {
      name: target.name,
      tableName: options?.tableName,
      traits,
      repository: options?.repository,
      connection: options?.connection,
    };
    defineMetadata(ENTITY_METADATA, meta, target);

    ObjectType({
      description: options?.description || `${target.name} entity`,
    })(target as any);
  };
}
