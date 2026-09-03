/**
 * @file get-link-service-token.util.ts
 * @module @stackra/nestjs-link/constants
 * @description Utility to generate the DI token for a specific link's low-level service.
 */

import { LINK_SERVICE_PREFIX } from './link-service-prefix.constant';

/**
 * Generates the DI token for a specific link's low-level service.
 *
 * @param linkName - The unique name of the link (e.g., 'RolePermission')
 * @returns The DI token string used to inject the LinkService instance
 *
 * @example
 * ```typescript
 * const token = getLinkServiceToken('RolePermission');
 * // => 'LINK_SERVICE_RolePermission'
 * ```
 */
export function getLinkServiceToken(linkName: string): string {
  return `${LINK_SERVICE_PREFIX}${linkName}`;
}
