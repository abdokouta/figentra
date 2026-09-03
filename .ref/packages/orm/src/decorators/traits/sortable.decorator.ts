/**
 * @file sortable.decorator.ts
 * @description Trait decorator that adds a sortOrder field for manual ordering of records.
 */

import { Field, Int } from '@nestjs/graphql';
import { addProperty } from '../../utils/add-property.util';
import { addTrait } from '../../utils/add-trait.util';

/**
 * Adds a `sortOrder` field for manual record ordering.
 * Useful for drag-and-drop reordering in UIs.
 *
 * @returns A class decorator function.
 *
 * @example
 * @Sortable()
 * @Entity({ name: 'MenuItem' })
 * class MenuItem extends BaseEntity { ... }
 */
export function Sortable(): ClassDecorator {
  return (target: Function) => {
    const proto = target.prototype;

    addTrait(proto, 'sortable');

    addProperty(proto, {
      key: 'sortOrder',
      type: 'integer',
      default: 0,
    });

    Field(() => Int, {
      description: 'Manual sort order for record positioning',
    })(proto, 'sortOrder');
  };
}
