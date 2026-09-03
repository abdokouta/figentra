/**
 * @file add-property.util.ts
 * @description Utility to add a StoredProperty definition to the class prototype metadata.
 */

import { defineMetadata, getMetadata } from '@vivtel/metadata';
import { PROPERTY_METADATA } from '../constants/metadata-keys.constant';
import { StoredProperty } from '../interfaces/stored-property.interface';

/**
 * Adds a StoredProperty to the metadata array on the target prototype.
 * Creates the array if it doesn't exist yet.
 *
 * Supports two call signatures:
 * - `addProperty(target, property)` — pass a full StoredProperty object
 * - `addProperty(target, key, options)` — pass key + partial options (merged)
 *
 * @param target - The class prototype to attach metadata to.
 * @param keyOrProperty - Either a property key string, or a full StoredProperty object.
 * @param options - Optional partial StoredProperty when first arg is a key string.
 */
export function addProperty(
  target: object,
  keyOrProperty: string | StoredProperty,
  options?: Partial<Omit<StoredProperty, 'key'>>
): void {
  const property: StoredProperty =
    typeof keyOrProperty === 'string' ? { key: keyOrProperty, ...options } : keyOrProperty;

  const existing: StoredProperty[] = getMetadata<StoredProperty[]>(PROPERTY_METADATA, target) || [];
  existing.push(property);
  defineMetadata(PROPERTY_METADATA, existing, target);
}
