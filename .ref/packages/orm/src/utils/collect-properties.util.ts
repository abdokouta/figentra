/**
 * @file collect-properties.util.ts
 * @description Utility to walk the prototype chain and collect all property definitions,
 * including those inherited from base classes and applied by traits.
 */

import { getMetadata } from '@vivtel/metadata';
import { PROPERTY_METADATA } from '../constants/metadata-keys.constant';
import { StoredProperty } from '../interfaces/stored-property.interface';

/**
 * Walks the prototype chain of a class and collects all StoredProperty definitions.
 * Properties from child classes override those from parent classes with the same key.
 *
 * @param target - The class constructor to collect properties from.
 * @returns Deduplicated array of stored property definitions.
 */
export function collectProperties(target: Function): StoredProperty[] {
  const map = new Map<string, StoredProperty>();
  let proto = target.prototype;

  while (proto && proto !== Object.prototype) {
    const props: StoredProperty[] = getMetadata<StoredProperty[]>(PROPERTY_METADATA, proto) || [];
    for (const prop of props) {
      // Child properties take precedence — don't overwrite
      if (!map.has(prop.key)) {
        map.set(prop.key, prop);
      }
    }
    proto = Object.getPrototypeOf(proto);
  }

  return Array.from(map.values());
}
