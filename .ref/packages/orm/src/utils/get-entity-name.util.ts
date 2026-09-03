/**
 * @file get-entity-name.util.ts
 * @description Utility to extract the entity name from a class constructor or string.
 */

import { getMetadata } from '@vivtel/metadata';
import { ENTITY_METADATA } from '../constants/metadata-keys.constant';
import { StoredEntityMeta } from '../interfaces/stored-entity-meta.interface';

/**
 * Extracts the entity name from a class or string.
 * If a class is provided, reads the name from entity metadata or falls back to class name.
 *
 * @param entityOrName - The entity class constructor or a string name.
 * @returns The resolved entity name.
 */
export function getEntityName(entityOrName: any): string {
  if (typeof entityOrName === 'string') return entityOrName;
  const meta: StoredEntityMeta | undefined = getMetadata<StoredEntityMeta>(
    ENTITY_METADATA,
    entityOrName
  );
  return meta?.name || entityOrName.name;
}
