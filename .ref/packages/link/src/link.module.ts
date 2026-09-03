/**
 * @file link.module.ts
 * @module @stackra/nestjs-link
 * @description NestJS module for the cross-module link system.
 *
 * `LinkModule` is the entry point for integrating the link system into
 * a NestJS application. It provides two registration patterns:
 *
 * ## Pattern 1: forRoot() — Global Setup (call once in AppModule)
 * Bootstraps the `LinkRegistry` and configures global options.
 * ```typescript
 * @Module({
 *   imports: [LinkModule.forRoot()],
 * })
 * export class AppModule {}
 * ```
 *
 * ## Pattern 2: forFeature() — Register Links (call in feature modules)
 * Registers specific links, generates their pivot table schemas,
 * and creates injectable services for each link.
 * ```typescript
 * @Module({
 *   imports: [
 *     LinkModule.forFeature([RolePermissionLink, RoleParentLink]),
 *   ],
 * })
 * export class RbacModule {}
 * ```
 *
 * ## What forFeature() Does
 * For each `LinkMetadata` passed:
 * 1. Generates a MikroORM `EntitySchema` for the pivot table (via `getLinkSchemas()` at root)
 * 2. Creates a `LinkService` provider (low-level, token: `LINK_SERVICE_<name>`)
 * 3. Creates a `LinkModuleService` provider (high-level, token: `LINK_MODULE_SERVICE_<name>`)
 * 4. Registers the metadata in the global `LinkRegistry`
 *
 * ## Injecting Link Services
 * ```typescript
 * // Option A: @InjectLink decorator (recommended)
 * @InjectLink('RolePermission')
 * private readonly rolePermLink: LinkModuleService;
 *
 * // Option B: @Inject with token
 * @Inject(getLinkModuleServiceToken('RolePermission'))
 * private readonly rolePermLink: LinkModuleService;
 * ```
 */

import { IDynamicModule, Module, IProvider } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { EntityManager } from '@mikro-orm/postgresql';
import { EntityRegistry } from '@stackra/nestjs-orm';
import type { IPubSubDriver } from '@stackra/contracts';
import { IPUBSUB_DEFAULT_CONNECTION } from '@stackra/contracts';
import { LinkRegistry } from './registries/link.registry';
import { LinkService } from './services/link.service';
import { LinkModuleService } from './services/link-module.service';
import { RemoteQueryService } from './services/remote-query.service';
import { generateLinkSchema } from './utils/generate-link-schema.util';
import {
  LINK_REGISTRY_TOKEN,
  LINK_PUBSUB_DRIVER_TOKEN,
  LINK_MODULE_OPTIONS_TOKEN,
  getLinkServiceToken,
  getLinkModuleServiceToken,
} from './constants';
import type { ILinkMetadata } from './interfaces/link-metadata.interface';
import type { ILinkModuleOptions } from './interfaces/link-module-options.interface';

/**
 * LinkModule — NestJS module for cross-entity many-to-many links.
 *
 * Provides `forRoot()` for global setup and `forFeature()` for
 * registering links in feature modules.
 */
@Module({})
export class LinkModule {
  /**
   * Bootstrap the link system (call once in AppModule).
   *
   * Creates the global `LinkRegistry` and configures shared options.
   * Must be called before any `forFeature()` calls.
   *
   * @param options - Global module options
   * @returns NestJS IDynamicModule
   *
   * @example
   * ```typescript
   * @Module({
   *   imports: [
   *     LinkModule.forRoot({ isGlobal: true, emitEvents: true }),
   *   ],
   * })
   * export class AppModule {}
   * ```
   */
  static forRoot(options?: ILinkModuleOptions): IDynamicModule {
    const isGlobal = options?.isGlobal ?? true;

    const providers: IProvider[] = [
      // Global LinkRegistry — holds all link metadata
      {
        provide: LINK_REGISTRY_TOKEN,
        useFactory: () => new LinkRegistry(),
      },
      // Make options available for forFeature modules
      {
        provide: LINK_MODULE_OPTIONS_TOKEN,
        useValue: options || {},
      },
      // RemoteQueryService — cross-module query traversal engine
      {
        provide: RemoteQueryService,
        useFactory: (registry: LinkRegistry) => new RemoteQueryService(registry),
        inject: [LINK_REGISTRY_TOKEN],
      },
    ];

    const exports: any[] = [LINK_REGISTRY_TOKEN, LINK_MODULE_OPTIONS_TOKEN, RemoteQueryService];

    // ─── PubSub driver wiring ───────────────────────────────────────────────
    // Resolve which PubSub connection to use:
    // - If `pubsubToken` is provided, alias it
    // - Else if `emitEvents !== false`, use the default connection from contracts
    // - Else: do not wire pubsub (events disabled)
    const pubsubToken =
      options?.pubsubToken ??
      (options?.emitEvents !== false ? IPUBSUB_DEFAULT_CONNECTION : undefined);

    if (pubsubToken) {
      providers.push({
        provide: LINK_PUBSUB_DRIVER_TOKEN,
        useExisting: pubsubToken,
      });
      exports.push(LINK_PUBSUB_DRIVER_TOKEN);
    } else {
      // Provide a null driver so forFeature's optional inject can resolve
      providers.push({
        provide: LINK_PUBSUB_DRIVER_TOKEN,
        useValue: undefined,
      });
      exports.push(LINK_PUBSUB_DRIVER_TOKEN);
    }

    return {
      module: LinkModule,
      global: isGlobal,
      providers,
      exports,
    };
  }

  /**
   * Register links for a feature module.
   *
   * For each link metadata:
   * 1. Generates the MikroORM pivot table schema
   * 2. Creates a `LinkService` provider (low-level CRUD)
   * 3. Creates a `LinkModuleService` provider (high-level with events)
   * 4. Registers metadata in the global `LinkRegistry`
   *
   * @param links - Array of LinkMetadata objects (from `defineLink()`)
   * @returns NestJS IDynamicModule
   *
   * @example
   * ```typescript
   * import { RolePermissionLink, RoleParentLink } from './links';
   *
   * @Module({
   *   imports: [
   *     LinkModule.forFeature([RolePermissionLink, RoleParentLink]),
   *   ],
   * })
   * export class RbacModule {}
   * ```
   */
  static forFeature(links: ILinkMetadata[]): IDynamicModule {
    const providers: IProvider[] = [];
    const exports: any[] = [];

    // ─── Auto-register link pivot schemas in EntityRegistry ─────────────────
    // This ensures OrmModule.forRoot() picks them up automatically without
    // the app needing to call getLinkSchemas() manually.
    for (const link of links) {
      if (!link.readOnly) {
        if (!link.schema) {
          link.schema = generateLinkSchema(link);
        }
        EntityRegistry.registerSchema(link.schema);
      }
    }

    for (const link of links) {
      // ─── LinkService provider (low-level) ─────────────────────────────────
      const serviceToken = getLinkServiceToken(link.name);
      providers.push({
        provide: serviceToken,
        useFactory: (em: EntityManager) => new LinkService(em, link),
        inject: ['MIKRO_ORM_ENTITY_MANAGER'],
      });
      exports.push(serviceToken);

      // ─── LinkModuleService provider (high-level with events) ──────────────
      const moduleServiceToken = getLinkModuleServiceToken(link.name);
      providers.push({
        provide: moduleServiceToken,
        useFactory: (em: EntityManager, pubsub?: IPubSubDriver) => {
          const linkService = new LinkService(em, link);
          return new LinkModuleService(linkService, link, pubsub);
        },
        inject: [
          'MIKRO_ORM_ENTITY_MANAGER',
          { token: LINK_PUBSUB_DRIVER_TOKEN, optional: true } as any,
        ],
      });
      exports.push(moduleServiceToken);
    }

    // ─── Registration provider — adds links to the global registry ──────────
    const registrationProvider: IProvider = {
      provide: `LINK_REGISTRATION_${Date.now()}_${Math.random()}`,
      useFactory: (registry: LinkRegistry, remoteQuery: RemoteQueryService) => {
        for (const link of links) {
          if (!registry.has(link.name)) {
            registry.register(link);
          }
          // Register cross-module extensions for query traversal
          if (link.extends?.length) {
            remoteQuery.registerExtensions(link.extends);
          }
        }
      },
      inject: [LINK_REGISTRY_TOKEN, RemoteQueryService],
    };
    providers.push(registrationProvider);

    // ─── DataLoader registration — auto-register link loaders ───────────────
    // Registers batch loaders with EntityDataLoaderFactory (if GraphQL module is present)
    for (const link of links) {
      const moduleServiceToken = getLinkModuleServiceToken(link.name);
      const loaderRegToken = `LINK_DATALOADER_REG_${link.name}`;

      providers.push({
        provide: loaderRegToken,
        useFactory: (loaderFactory: any) => {
          if (!loaderFactory || typeof loaderFactory.registerLinkLoader !== 'function') return null;
          // Register source→targets loader
          loaderFactory.registerLinkLoader(
            `link:${link.name}:source`,
            moduleServiceToken,
            'source'
          );
          // Register target→sources loader
          loaderFactory.registerLinkLoader(
            `link:${link.name}:target`,
            moduleServiceToken,
            'target'
          );
          return null; // side-effect only
        },
        inject: [{ token: 'EntityDataLoaderFactory', optional: true } as any],
      });
    }

    // ─── Build the dynamic module ───────────────────────────────────────────
    // OrmModule.forFeature() already imports MikroOrmModule.forFeature(schemas)
    // which provides EntityManager. Link providers are registered in the same
    // module scope, so they can inject EntityManager.

    return {
      module: LinkModule,
      imports: [MikroOrmModule.forFeature([])],
      providers,
      exports,
    };
  }
}
