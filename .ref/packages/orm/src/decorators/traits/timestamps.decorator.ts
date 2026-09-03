/**
 * @file timestamps.decorator.ts
 * @description Trait decorator that adds createdAt and updatedAt timestamp fields to an entity.
 */

import { Field } from '@nestjs/graphql';
import { addProperty } from '../../utils/add-property.util';
import { addTrait } from '../../utils/add-trait.util';

/**
 * Adds `createdAt` and `updatedAt` timestamp fields to the entity.
 * These fields are automatically managed by the ORM.
 *
 * @returns A class decorator function.
 *
 * @example
 * @Timestamps()
 * @Entity({ name: 'Tenant' })
 * class Tenant extends BaseEntity { ... }
 */
export function Timestamps(): ClassDecorator {
  return (target: Function) => {
    const proto = target.prototype;

    addTrait(proto, 'timestamps');

    addProperty(proto, {
      key: 'createdAt',
      type: 'datetime',
      onCreate: () => new Date(),
    });

    addProperty(proto, {
      key: 'updatedAt',
      type: 'datetime',
      onCreate: () => new Date(),
      onUpdate: () => new Date(),
    });

    Field(() => Date, {
      description: 'Timestamp when the record was created',
    })(proto, 'createdAt');

    Field(() => Date, {
      description: 'Timestamp when the record was last updated',
    })(proto, 'updatedAt');
  };
}
