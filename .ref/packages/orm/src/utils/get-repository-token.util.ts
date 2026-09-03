/**
 * @file get-repository-token.util.ts
 * @description Utility to generate the DI token string for a repository provider.
 */

import { getMetadata } from '@vivtel/metadata';
import { REPOSITORY_TOKEN_PREFIX } from '../constants/tokens.constant';
import { ENTITY_METADATA } from '../constants/metadata-keys.constant';
import { StoredEntityMeta } from '../interfaces/stored-entity-meta.interface';

/**
 * Generates the DI token for a repository.
 * Accepts entity class or string name.
 *
 * @param entityOrName - The entity class constructor or a string name.
 * @returns The DI token string for the repository provider.
 *
 * @example
 * getRepositoryToken(User)    // 'ORM_REPOSITORY_User'
 * getRepositoryToken('User')  // 'ORM_REPOSITORY_User'
 */
export function getRepositoryToken(entityOrName: any): string {
  if (typeof entityOrName === 'string') {
    return `${REPOSITORY_TOKEN_PREFIX}${entityOrName}`;
  }
  // It's a class — read the entity name from metadata
  const meta: StoredEntityMeta | undefined = getMetadata<StoredEntityMeta>(
    ENTITY_METADATA,
    entityOrName
  );
  const name = meta?.name || entityOrName.name;
  return `${REPOSITORY_TOKEN_PREFIX}${name}`;
}
