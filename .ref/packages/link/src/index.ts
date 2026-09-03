/**
 * @file index.ts
 * @module @stackra/nestjs-link
 * @description Main entry point for the `@stackra/nestjs-link` package.
 *
 * Provides a cross-module link system for defining many-to-many relationships
 * between entities from different modules. Inspired by MedusaJS's link system,
 * adapted for NestJS + MikroORM.
 *
 * ## Features
 * - **`defineLink()`** — Declarative link definition with convention-over-configuration
 * - **Auto-schema generation** — MikroORM EntitySchemas created from metadata
 * - **Soft-delete / restore** — Mark links as deleted without removing them
 * - **Event emission** — Hooks into NestJS EventEmitter for reactive patterns
 * - **Bulk operations** — Efficient batch attach/detach
 * - **Sync** — Atomic "set" operation (replaces all links for a source)
 * - **Read-only links** — Virtual relationships without pivot tables
 * - **Extra pivot columns** — Store additional data on the relationship
 *
 * ## Quick Start
 * ```typescript
 * // 1. Define a link
 * import { defineLink } from '@stackra/nestjs-link';
 * import { Role } from './entities/role.entity';
 * import { Permission } from './entities/permission.entity';
 *
 * export const RolePermissionLink = defineLink({
 *   source: Role,
 *   target: Permission,
 *   sourceRelation: 'permissions',
 *   targetRelation: 'roles',
 * });
 *
 * // 2. Register in module
 * import { LinkModule } from '@stackra/nestjs-link';
 *
 * @Module({
 *   imports: [LinkModule.forFeature([RolePermissionLink])],
 * })
 * export class RbacModule {}
 *
 * // 3. Use in service
 * import { InjectLink, LinkModuleService } from '@stackra/nestjs-link';
 *
 * @Injectable()
 * export class RoleService {
 *   constructor(
 *     @InjectLink('RolePermission')
 *     private readonly rolePermLink: LinkModuleService,
 *   ) {}
 *
 *   async assignPermissions(roleId: string, permIds: string[]) {
 *     await this.rolePermLink.attach(roleId, permIds);
 *   }
 *
 *   async getPermissions(roleId: string) {
 *     return this.rolePermLink.listBySource(roleId);
 *   }
 * }
 * ```
 *
 * ## App Module Setup
 * ```typescript
 * import { LinkModule } from '@stackra/nestjs-link';
 * import { PubSubModule, getPubSubToken } from '@stackra/nestjs-pubsub';
 *
 * @Module({
 *   imports: [
 *     PubSubModule.forRoot({ ... }),       // PubSub driver setup
 *     LinkModule.forRoot({                 // Global link registry
 *       pubsubToken: getPubSubToken(),     // Enables link event publishing
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */

// ─── Module ───────────────────────────────────────────────────────────────────
export { LinkModule } from './link.module';

// ─── Factories ────────────────────────────────────────────────────────────────
export { defineLink } from './factories/define-link.factory';
export { getLinkProviders } from './factories/get-link-providers.factory';

// ─── Services ─────────────────────────────────────────────────────────────────
export { LinkService } from './services/link.service';
export { LinkModuleService } from './services/link-module.service';
export { RemoteQueryService } from './services/remote-query.service';
export type { ILinkEventData } from './services/link-module.service';

// ─── Registry ─────────────────────────────────────────────────────────────────
export { LinkRegistry } from './registries/link.registry';

// ─── Decorators ───────────────────────────────────────────────────────────────
export { InjectLink } from './decorators/inject-link.decorator';

// ─── Schema ───────────────────────────────────────────────────────────────────
export { generateLinkSchema } from './utils/generate-link-schema.util';

// ─── Constants ────────────────────────────────────────────────────────────────
export {
  LINK_REGISTRY_TOKEN,
  LINK_PUBSUB_DRIVER_TOKEN,
  LINK_MODULE_OPTIONS_TOKEN,
  LINK_SERVICE_PREFIX,
  LINK_MODULE_SERVICE_PREFIX,
  getLinkServiceToken,
  getLinkModuleServiceToken,
} from './constants';

// ─── Interfaces ───────────────────────────────────────────────────────────────
export type { SortDirection } from './interfaces/link-filter.interface';
export type {
  ILinkExtends,
  ILinkRelationship,
  FieldAliasValue,
} from './interfaces/link-extends.interface';
export type {
  IRemoteQuery,
  IRemoteQueryExpand,
  IRemoteQueryResult,
  IServiceResolver,

// ─── Utils ────────────────────────────────────────────────────────────────────
export { composeLinkName } from './utils/compose-link-name.util';
export { composeTableName } from './utils/compose-table-name.util';
export { getLinkSchemas } from './utils/get-link-schemas.util';
