/**
 * @file userstamps.decorator.ts
 * @description Trait decorator that adds createdBy and updatedBy user tracking fields to an entity.
 */

import { Field } from '@nestjs/graphql';
import { addProperty } from '../../utils/add-property.util';
import { addTrait } from '../../utils/add-trait.util';

/**
 * Adds `createdBy` and `updatedBy` fields to track which user created/modified the record.
 *
 * @returns A class decorator function.
 *
 * @example
 * @Userstamps()
 * @Entity({ name: 'Tenant' })
 * class Tenant extends BaseEntity { ... }
 */
export function Userstamps(): ClassDecorator {
  return (target: Function) => {
    const proto = target.prototype;

    addTrait(proto, 'userstamps');

    addProperty(proto, {
      key: 'createdBy',
      type: 'string',
      nullable: true,
    });

    addProperty(proto, {
      key: 'updatedBy',
      type: 'string',
      nullable: true,
    });

    Field(() => String, {
      nullable: true,
      description: 'ID of the user who created this record',
    })(proto, 'createdBy');

    Field(() => String, {
      nullable: true,
      description: 'ID of the user who last updated this record',
    })(proto, 'updatedBy');
  };
}
