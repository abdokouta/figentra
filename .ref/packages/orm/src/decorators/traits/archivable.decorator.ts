/**
 * @file archivable.decorator.ts
 * @description Trait decorator that adds archive capability to an entity
 * with archivedAt and archivedBy fields.
 */

import { Field } from '@nestjs/graphql';
import { addProperty } from '../../utils/add-property.util';
import { addTrait } from '../../utils/add-trait.util';

/**
 * Adds archive fields (`archivedAt`, `archivedBy`) to the entity.
 * Records can be archived without being deleted.
 *
 * @returns A class decorator function.
 *
 * @example
 * @Archivable()
 * @Entity({ name: 'Project' })
 * class Project extends BaseEntity { ... }
 */
export function Archivable(): ClassDecorator {
  return (target: Function) => {
    const proto = target.prototype;

    addTrait(proto, 'archivable');

    addProperty(proto, {
      key: 'archivedAt',
      type: 'datetime',
      nullable: true,
    });

    addProperty(proto, {
      key: 'archivedBy',
      type: 'string',
      nullable: true,
    });

    Field(() => Date, {
      nullable: true,
      description: 'Timestamp when the record was archived',
    })(proto, 'archivedAt');

    Field(() => String, {
      nullable: true,
      description: 'ID of the user who archived this record',
    })(proto, 'archivedBy');
  };
}
