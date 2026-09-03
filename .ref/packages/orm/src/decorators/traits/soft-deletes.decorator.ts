/**
 * @file soft-deletes.decorator.ts
 * @description Trait decorator that adds soft-delete capability to an entity
 * with deletedAt and deletedBy fields.
 */

import { Field } from '@nestjs/graphql';
import { addProperty } from '../../utils/add-property.util';
import { addTrait } from '../../utils/add-trait.util';

/**
 * Adds soft-delete fields (`deletedAt`, `deletedBy`) to the entity.
 * Records are marked as deleted rather than physically removed.
 *
 * @returns A class decorator function.
 *
 * @example
 * @SoftDeletes()
 * @Entity({ name: 'Tenant' })
 * class Tenant extends BaseEntity { ... }
 */
export function SoftDeletes(): ClassDecorator {
  return (target: Function) => {
    const proto = target.prototype;

    addTrait(proto, 'softDeletes');

    addProperty(proto, {
      key: 'deletedAt',
      type: 'datetime',
      nullable: true,
    });

    addProperty(proto, {
      key: 'deletedBy',
      type: 'string',
      nullable: true,
    });

    Field(() => Date, {
      nullable: true,
      description: 'Timestamp when the record was soft-deleted',
    })(proto, 'deletedAt');

    Field(() => String, {
      nullable: true,
      description: 'ID of the user who deleted this record',
    })(proto, 'deletedBy');
  };
}
