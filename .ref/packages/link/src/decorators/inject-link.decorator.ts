/**
 * @file inject-link.decorator.ts
 * @module @stackra/nestjs-link/decorators
 * @description `@InjectLink()` decorator for injecting link services.
 *
 * Provides a clean, type-safe way to inject a specific link's service
 * into any NestJS provider. Under the hood, it resolves the DI token
 * for the link's `LinkModuleService` instance.
 *
 * ## Usage
 * ```typescript
 * @Injectable()
 * export class RoleService {
 *   constructor(
 *     @InjectLink('RolePermission')
 *     private readonly rolePermLink: LinkModuleService,
 *
 *     @InjectLink('RoleParent')
 *     private readonly roleParentLink: LinkModuleService,
 *   ) {}
 *
 *   async assignPermissions(roleId: string, permIds: string[]) {
 *     await this.rolePermLink.attach(roleId, permIds);
 *   }
 * }
 * ```
 *
 * ## How It Works
 * 1. Takes the link name (e.g., 'RolePermission')
 * 2. Generates the DI token: `LINK_MODULE_SERVICE_RolePermission`
 * 3. Returns a `@Inject(token)` decorator
 *
 * This is syntactic sugar — you could also use `@Inject(getLinkModuleServiceToken('RolePermission'))`
 * directly, but `@InjectLink()` is more readable and less error-prone.
 */

import { Inject } from '@nestjs/common';
import { getLinkModuleServiceToken } from '../constants';

/**
 * Injects the `LinkModuleService` for a specific link.
 *
 * @param linkName - The unique name of the link (matches the name from `defineLink()`)
 * @returns A NestJS parameter decorator
 *
 * @example
 * ```typescript
 * constructor(
 *   @InjectLink('RolePermission')
 *   private readonly rolePermLink: LinkModuleService,
 * ) {}
 * ```
 */
export function InjectLink(linkName: string): ParameterDecorator {
  return Inject(getLinkModuleServiceToken(linkName));
}
