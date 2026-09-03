/**
 * @file get-properties.util.ts
 * @description Utility to read property definitions from a class prototype's own metadata.
 */

import { getMetadata } from '@vivtel/metadata';
import { PROPERTY_METADATA } from '../constants/metadata-keys.constant';
import { StoredProperty } from '../interfaces/stored-property.interface';

/**
 * Reads the property definitions stored on the given target's own metadata.
 * Does not walk the prototype chain — use collectProperties for that.
 *
 * @param target - The class prototype to read metadata from.
 * @returns Array of stored property definitions.
 */
export function getProperties(target: object): StoredProperty[] {
  return getMetadata<StoredProperty[]>(PROPERTY_METADATA, target) || [];
}
