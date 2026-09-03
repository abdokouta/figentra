/**
 * @file expirable.decorator.ts
 * @description Trait decorator that adds expiration capability to an entity
 * with an expiresAt field.
 */

import { Field } from '@nestjs/graphql';
import { addProperty } from '../../utils/add-property.util';
import { addTrait } from '../../utils/add-trait.util';

/**
 * Adds an expiration field (`expiresAt`) to the entity.
 * Records can have a time-based expiration for TTL-style workflows.
 *
 * @returns A class decorator function.
 *
 * @example
 * @Expirable()
 * @Entity({ name: 'Invitation' })
 * class Invitation extends BaseEntity { ... }
 */
export function Expirable(): ClassDecorator {
  return (target: Function) => {
    const proto = target.prototype;

    addTrait(proto, 'expirable');

    addProperty(proto, {
      key: 'expiresAt',
      type: 'datetime',
      nullable: true,
    });

    Field(() => Date, {
      nullable: true,
      description: 'Timestamp when the record expires',
    })(proto, 'expiresAt');
  };
}
