/**
 * @file versionable.decorator.ts
 * @description Trait decorator that adds a version field for optimistic locking.
 */

import { Field, Int } from '@nestjs/graphql';
import { addProperty } from '../../utils/add-property.util';
import { addTrait } from '../../utils/add-trait.util';

/**
 * Adds a `version` field for optimistic locking.
 * The version is incremented on each update.
 *
 * @returns A class decorator function.
 *
 * @example
 * @Versionable()
 * @Entity({ name: 'Tenant' })
 * class Tenant extends BaseEntity { ... }
 */
export function Versionable(): ClassDecorator {
  return (target: Function) => {
    const proto = target.prototype;

    addTrait(proto, 'versionable');

    addProperty(proto, {
      key: 'version',
      type: 'integer',
      version: true,
    });

    Field(() => Int, {
      description: 'Optimistic locking version number',
    })(proto, 'version');
  };
}
