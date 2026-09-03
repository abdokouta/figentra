/**
 * @file base-entity.ts
 * @description Defines the abstract base entity class that all ORM entities extend.
 * Provides the `id` primary key field with GraphQL and metadata registration.
 */

import { defineMetadata, getMetadata } from '@vivtel/metadata';
import { Field, ID } from '@nestjs/graphql';
import { PROPERTY_METADATA } from '../constants/metadata-keys.constant';
import { StoredProperty } from '../interfaces/stored-property.interface';

/**
 * Abstract base entity providing a UUID primary key.
 * All entities in the system should extend this class.
 */
export class BaseEntity {
  /** Unique identifier (UUID) for the entity. */
  @Field(() => ID, { description: 'Unique identifier (UUID)' })
  id!: string;

  /** Allow dynamic property access for trait-injected fields. */
  [key: string]: any;
}

// Register the `id` property in metadata so defineSchema picks it up
const idProperty: StoredProperty = {
  key: 'id',
  type: 'uuid',
  primary: true,
};

const existing: StoredProperty[] =
  getMetadata<StoredProperty[]>(PROPERTY_METADATA, BaseEntity.prototype) || [];
existing.push(idProperty);
defineMetadata(PROPERTY_METADATA, existing, BaseEntity.prototype);
