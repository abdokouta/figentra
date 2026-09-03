/**
 * @file get-link-providers.ts
 * @module @stackra/nestjs-link/factories
 * @description Returns NestJS providers for link services — to be spread into a host module.
 *
 * ## Why not a DynamicModule?
 * MikroORM's `EntityManager` is provided by `MikroOrmCoreModule` which is `@Global()`.
 * However, NestJS resolves providers within module scope — and dynamic child modules
 * created by `LinkModule.forFeature()` can't always access the global `EntityManager`
 * due to async module initialization timing.
 *
 * The solution: instead of creating a child module, we return raw providers that get
 * added directly to the host module (which already has `EntityManager` available via
 * `OrmModule.forFeature()` or the global `MikroOrmCoreModule`).
 *
 * ## Usage
 * ```typescript
 * import { getLinkProviders } from '@stackra/nestjs-link';
 * import { UserRoleLink } from './links/user-role.link';
 *
 * @Module({
 *   imports: [OrmModule.forFeature([...])],
 *   providers: [...getLinkProviders(UserRoleLink)],
 *   exports: [...getLinkProviders(UserRoleLink)],
 * })
 * export class UserModule {}
 * ```
 *
 * Or use `LinkModule.forFeature()` which wraps this internally (preferred when
 * the module already imports `OrmModule.forFeature()`).
 */

import { IProvider } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { LinkService } from '../services/link.service';
import { LinkModuleService } from '../services/link-module.service';
import type { ILinkMetadata } from '../interfaces/link-metadata.interface';
import {
  getLinkServiceToken,
  getLinkModuleServiceToken,
  LINK_PUBSUB_DRIVER_TOKEN,
} from '../constants';

/**
 * Generates NestJS providers for one or more link definitions.
 *
 * Returns an array of providers that can be spread into a module's
 * `providers` and `exports` arrays. Each link gets:
 * - A `LinkService` provider (low-level CRUD, token: `LINK_SERVICE_<name>`)
 * - A `LinkModuleService` provider (high-level with events, token: `LINK_MODULE_SERVICE_<name>`)
 *
 * @param links - One or more LinkMetadata objects (from `defineLink()`)
 * @returns Array of NestJS IProvider definitions
 *
 * @example
 * ```typescript
 * const providers = getLinkProviders(UserRoleLink, RolePermissionLink);
 *
 * @Module({
 *   providers: [...providers],
 *   exports: [...providers],
 * })
 * ```
 */
export function getLinkProviders(...links: ILinkMetadata[]): IProvider[] {
  const providers: IProvider[] = [];

  for (const link of links) {
    // ─── LinkService provider (low-level) ─────────────────────────────────
    providers.push({
      provide: getLinkServiceToken(link.name),
      useFactory: (em: EntityManager) => new LinkService(em, link),
      inject: [EntityManager],
    });

    // ─── LinkModuleService provider (high-level with events) ──────────────
    providers.push({
      provide: getLinkModuleServiceToken(link.name),
      useFactory: (em: EntityManager, pubsub?: any) => {
        const linkService = new LinkService(em, link);
        return new LinkModuleService(linkService, link, pubsub);
      },
      inject: [EntityManager, { token: LINK_PUBSUB_DRIVER_TOKEN, optional: true } as any],
    });
  }

  return providers;
}
