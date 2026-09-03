/**
 * @file get-link-module-service-token.util.ts
 * @module @stackra/nestjs-link/constants
 * @description Utility to generate the DI token for a specific link's high-level module service.
 */

import { LINK_MODULE_SERVICE_PREFIX } from './link-module-service-prefix.constant';

/**
 * Generates the DI token for a specific link's high-level module service.
 *
 * @param linkName - The unique name of the link (e.g., 'RolePermission')
 * @returns The DI token string used to inject the LinkModuleService instance
 *
 * @example
 * ```typescript
 * const token = getLinkModuleServiceToken('RolePermission');
 * // => 'LINK_MODULE_SERVICE_RolePermission'
 * ```
 */
export function getLinkModuleServiceToken(linkName: string): string {
  return `${LINK_MODULE_SERVICE_PREFIX}${linkName}`;
}
