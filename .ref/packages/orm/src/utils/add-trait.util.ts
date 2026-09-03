/**
 * @file add-trait.util.ts
 * @description Utility to register a trait name in the class prototype metadata.
 */

import { defineMetadata, getMetadata } from '@vivtel/metadata';
import { TRAIT_METADATA } from '../constants/metadata-keys.constant';

/**
 * Adds a trait name to the metadata array on the target prototype.
 * Prevents duplicate trait registrations.
 *
 * @param target - The class prototype to attach metadata to.
 * @param traitName - The name of the trait being applied.
 */
export function addTrait(target: object, traitName: string): void {
  const existing: string[] = getMetadata<string[]>(TRAIT_METADATA, target) || [];
  if (!existing.includes(traitName)) {
    existing.push(traitName);
  }
  defineMetadata(TRAIT_METADATA, existing, target);
}
