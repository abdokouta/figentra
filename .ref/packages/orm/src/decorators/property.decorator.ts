/**
 * @file property.decorator.ts
 * @description Property decorator that registers a field with ORM metadata + GraphQL.
 */

import { Field } from '@nestjs/graphql';
import { PropertyOptions } from '../interfaces/property-options.interface';
import { addProperty } from '../utils/add-property.util';
import { resolveGraphQLType } from '../utils/resolve-graphql-type.util';

/**
 * @Property() — marks a field as a database column + GraphQL field.
 *
 * @param options - Column configuration (type, nullable, unique, etc.)
 *
 * @example
 * ```ts
 * @Property() name!: string;
 * @Property({ nullable: true }) description?: string | null;
 * @Property({ type: 'decimal', precision: 10, scale: 2 }) price!: number;
 * ```
 */
export function Property(options: PropertyOptions = {}): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    const key = String(propertyKey);

    addProperty(target, {
      key,
      type: options.type,
      primary: options.primary,
      unique: options.unique,
      nullable: options.nullable,
      default: options.default,
      index: options.index,
      enum: options.enum,
      onCreate: options.onCreate,
      onUpdate: options.onUpdate,
      version: options.version,
      length: options.length,
      precision: options.precision,
      scale: options.scale,
    });

    const gqlType = resolveGraphQLType(options.type);
    Field(() => gqlType, { nullable: options.nullable ?? false })(target, propertyKey);
  };
}
