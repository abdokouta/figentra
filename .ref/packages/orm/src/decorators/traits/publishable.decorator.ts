/**
 * @file publishable.decorator.ts
 * @description Trait decorator that adds publish capability to an entity
 * with publishedAt and publishedBy fields.
 */

import { Field } from '@nestjs/graphql';
import { addProperty } from '../../utils/add-property.util';
import { addTrait } from '../../utils/add-trait.util';

/**
 * Adds publish fields (`publishedAt`, `publishedBy`) to the entity.
 * Records can be published/unpublished for content management workflows.
 *
 * @returns A class decorator function.
 *
 * @example
 * @Publishable()
 * @Entity({ name: 'Article' })
 * class Article extends BaseEntity { ... }
 */
export function Publishable(): ClassDecorator {
  return (target: Function) => {
    const proto = target.prototype;

    addTrait(proto, 'publishable');

    addProperty(proto, {
      key: 'publishedAt',
      type: 'datetime',
      nullable: true,
    });

    addProperty(proto, {
      key: 'publishedBy',
      type: 'string',
      nullable: true,
    });

    Field(() => Date, {
      nullable: true,
      description: 'Timestamp when the record was published',
    })(proto, 'publishedAt');

    Field(() => String, {
      nullable: true,
      description: 'ID of the user who published this record',
    })(proto, 'publishedBy');
  };
}
