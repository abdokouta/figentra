/**
 * @file primary-key.decorator.ts
 * @description Property decorator that marks a field as the primary key of an entity.
 * Registers it with both ORM metadata and GraphQL ID type.
 */

import { Field, ID } from '@nestjs/graphql';
import { addProperty } from '../utils/add-property.util';

/**
 * Options for the @PrimaryKey() decorator.
 */
interface PrimaryKeyOptions {
  /** Human-readable description. Defaults to 'Primary key'. */
  description?: string;
}

/**
 * Marks a property as the primary key of the entity.
 * Automatically registers it as a GraphQL ID field.
 *
 * @param options - Optional configuration for the primary key.
 * @returns A property decorator function.
 *
 * @example
 * @PrimaryKey()
 * id!: string;
 */
export function PrimaryKey(options: PrimaryKeyOptions = {}): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    const key = String(propertyKey);
    const description = options.description || 'Primary key';

    addProperty(target, { key, type: 'uuid', primary: true });

    Field(() => ID, { description })(target, propertyKey);
  };
}
