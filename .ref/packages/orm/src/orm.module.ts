/**
 * @file orm.module.ts
 * @description The main ORM module. Wraps MikroORM + NestJS + GraphQL.
 *
 * Single entry point for entity-related data layer concerns:
 * - Entity schema generation (from decorated classes)
 * - Service/resolver auto-generation or custom wiring
 * - Database connection management
 * - Health indicator registration
 *
 * For cross-module pivot relationships (many-to-many links between
 * entities from different modules), use `@stackra/nestjs-link` separately.
 *
 * ## Standard Usage
 * ```ts
 * OrmModule.forRoot({
 *   entities: [User, Role, Permission],
 *   connection: { dbName: 'my_service', ... },
 * })
 * ```
 */

import { getMetadata } from '@vivtel/metadata';
import { IDynamicModule, Module, IProvider, Controller } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { IdefineConfig, EntityManager } from '@mikro-orm/postgresql';
import { Resolver } from '@nestjs/graphql';
import { ModuleRef } from '@nestjs/core';
import { ZodValidationPipe } from './http/pipes/zod-validation.pipe';
import { defineSchema, collectSchemas } from './schema/build-schema';
import { defineService } from './factories/crud-service.factory';
import { defineResolver } from './factories/crud-resolver.factory';
import { defineController } from './http/generators/crud-controller.factory';
import { RELATION_METADATA } from './relations/constants/relation-tokens.constant';
import { LifecycleHooksSubscriber } from './subscribers/lifecycle-hooks.subscriber';
import { ScopeRegistry } from './query-builder/scope-registry';
import { EntityRegistryService } from './services/entity-registry.service';

/** @internal Set the global indexer service reference. */
export function setGlobalIndexer(indexer: any): void {
  (globalThis as any).__ORM_INDEXER_SERVICE__ = indexer;
}

/** @internal Get the global indexer service reference. */
export function getGlobalIndexer(): any {
  return (globalThis as any).__ORM_INDEXER_SERVICE__ || null;
}

import { getEntityName } from './utils/get-entity-name.util';
import {
  EntityRegistration,
  ControllerRegistrationOptions,
} from './interfaces/entity-registration.interface';
import { OrmModuleOptions } from './interfaces/orm-module-options.interface';
import { DatabaseHealthIndicator } from './indicators/database-health.indicator';
import { SchemaRegistry } from './schema-registry/schema-registry.service';
import { SchemaRegistryPopulator } from './schema-registry/schema-registry-populator.service';
import { SchemaController } from './schema-registry/schema.controller';

/**
 * Internal schema registry — maps entity class → generated schema.
 * Prevents duplicate schema generation across forRoot/forFeature calls.
 */
const schemaRegistry = new Map<Function, any>();

/**
 * Simple pluralization for auto-generated REST paths.
 * Handles common English suffixes.
 */
function pluralizeSimple(word: string): string {
  if (word.endsWith('y') && !word.endsWith('ay') && !word.endsWith('ey') && !word.endsWith('oy')) {
    return word.slice(0, -1) + 'ies';
  }
  if (word.endsWith('s') || word.endsWith('x') || word.endsWith('ch') || word.endsWith('sh')) {
    return word + 'es';
  }
  return word + 's';
}

/**
 * Resolves or generates the MikroORM schema for an entity class.
 * Caches the result to avoid duplicate generation.
 */
function resolveSchema(entity: Function): any {
  if (!schemaRegistry.has(entity)) {
    schemaRegistry.set(entity, defineSchema(entity));
  }
  return schemaRegistry.get(entity);
}

/**
 * Checks if a value is already a MikroORM EntitySchema instance.
 * EntitySchema instances have a `meta` property with entity metadata.
 */
function isEntitySchema(value: any): boolean {
  return value && typeof value === 'object' && 'meta' in value && 'name' in value;
}

/**
 * Collects all schemas (main + satellites) for a list of entity classes
 * and/or pre-built EntitySchema instances (e.g., from getLinkSchemas()).
 *
 * Items that are already EntitySchema instances are passed through as-is.
 * Items that are entity classes are processed through defineSchema().
 */
function collectSchemasFromEntities(entities: any[]): any[] {
  const schemas: any[] = [];
  const entityClasses: any[] = [];

  for (const entity of entities) {
    if (isEntitySchema(entity)) {
      // Already a MikroORM EntitySchema (e.g., link pivot table schema)
      schemas.push(entity);
    } else {
      // Entity class — needs defineSchema() processing
      entityClasses.push(resolveSchema(entity));
    }
  }

  // collectSchemas handles satellite schemas (translations, etc.)
  const collected = entityClasses.length > 0 ? collectSchemas(...entityClasses) : [];

  return [...collected, ...schemas];
}

/**
 * OrmModule — entry point for entity registration and database setup.
 *
 * Cross-module pivot relationships are handled by `@stackra/nestjs-link` separately.
 *
 * @example
 * ```ts
 * // Root (app.module.ts):
 * OrmModule.forRoot({
 *   entities: [User, Role, Permission, Invitation],
 *   connection: { dbName: 'identity_service', user: 'postgres', password: 'postgres' },
 * })
 *
 * // Feature (user.module.ts) — fully auto-generated:
 * OrmModule.forFeature([
 *   { entity: User, service: UserService, dto: { create, update, filter, sort } },
 * ])
 * ```
 */
@Module({})
export class OrmModule {
  /**
   * Register the root MikroORM connection with all entities.
   *
   * Handles:
   * 1. Entity schema generation (from decorated classes)
   * 2. MikroORM initialization with all schemas
   * 3. Database health indicator registration
   *
   * Call once in AppModule.
   */
  static forRoot(options: OrmModuleOptions): IDynamicModule {
    // ─── Validate connection options ────────────────────────────────────────
    const connectionEntries = Object.entries(options.connections || {});
    if (connectionEntries.length === 0) {
      throw new Error(
        '[OrmModule] At least one connection must be configured under `connections`.'
      );
    }
    if (options.default && !options.connections[options.default]) {
      throw new Error(
        `[OrmModule] options.default = "${options.default}" does not match ` +
          `any registered connection. Available: ${Object.keys(options.connections).join(', ')}`
      );
    }

    // ─── Resolve default connection name ────────────────────────────────────
    // Priority: explicit `default` → connection literally named "default" → first entry.
    const defaultName =
      options.default ?? (options.connections.default ? 'default' : connectionEntries[0]![0]);
    const defaultConn = options.connections[defaultName]!;

    // ─── Generate entity schemas ────────────────────────────────────────────
    const entitySchemas = collectSchemasFromEntities(options.entities);

    // ─── Build root MikroORM config (the default connection) ────────────────
    const lifecycleSubscriber = new LifecycleHooksSubscriber();
    const existingSubscribers = options.subscribers || [];

    const mikroOrmConfig = IdefineConfig({
      entities: [...entitySchemas, ...(defaultConn.entities || [])],
      dbName: defaultConn.dbName,
      host: defaultConn.host || 'localhost',
      port: defaultConn.port || 5432,
      user: defaultConn.user,
      password: defaultConn.password,
      debug: options.debug ?? defaultConn.debug ?? false,
      allowGlobalContext: defaultConn.allowGlobalContext ?? options.allowGlobalContext ?? true,
      discovery: { warnWhenNoEntities: false, ...defaultConn.discovery },
      schemaGenerator: { disableForeignKeys: true },
      subscribers: [lifecycleSubscriber, ...existingSubscribers],
    });

    const imports: any[] = [
      MikroOrmModule.forRoot({ ...mikroOrmConfig, autoLoadEntities: true } as any),
    ];

    // ─── Register additional connections (everything except the default) ────
    for (const [name, conn] of connectionEntries) {
      if (name === defaultName) continue;

      const namedConfig = IdefineConfig({
        entities: entitySchemas,
        dbName: conn.dbName,
        host: conn.host || 'localhost',
        port: conn.port || 5432,
        user: conn.user,
        password: conn.password,
        debug: options.debug ?? conn.debug ?? false,
        allowGlobalContext: options.allowGlobalContext ?? true,
        schemaGenerator: { disableForeignKeys: true },
      });
      imports.push(MikroOrmModule.forRoot(namedConfig as any));
    }

    // ─── Initialize ScopeRegistry and EntityRegistry ──────────────────────
    // ScopeRegistry is created here as a value provider.
    // EntityRegistryService populates it in onModuleInit() after ALL modules
    // have registered their entities — solving the forFeature() timing problem.
    const scopeRegistry = new ScopeRegistry();

    return {
      module: OrmModule,
      imports,
      providers: [
        DatabaseHealthIndicator,
        SchemaRegistry,
        SchemaRegistryPopulator,
        SchemaController,
        // Global Zod validation pipe — validates only when schema is attached
        {
          provide: APP_PIPE,
          useClass: ZodValidationPipe,
        },
        // Global ScopeRegistry — available to FluentQueryBuilder and services
        { provide: ScopeRegistry, useValue: scopeRegistry },
        // EntityRegistryService — accumulates entities, populates scopes in onModuleInit
        EntityRegistryService,
        // Seed the registry with forRoot() entities immediately
        {
          provide: 'ORM_ENTITY_REGISTRY_SEED',
          useFactory: (registry: EntityRegistryService) => {
            registry.addEntities(options.entities);
            return null;
          },
          inject: [EntityRegistryService],
        },
        // Re-provide EntityManager under a string token so it's discoverable
        {
          provide: 'EntityManager',
          useFactory: (em: any) => em,
          inject: [EntityManager],
        },
        // Register scope context store globally for defineService() auto-population
        {
          provide: 'SCOPE_STORE_GLOBAL_REF',
          useFactory: (scopeStore?: any) => {
            if (scopeStore) {
              (globalThis as any).__SCOPE_CONTEXT_STORE__ = scopeStore;
            }
            return null;
          },
          inject: [{ token: 'SCOPE_CONTEXT_STORE', optional: true }],
        },
      ],
      exports: [
        DatabaseHealthIndicator,
        SchemaRegistry,
        SchemaRegistryPopulator,
        SchemaController,
        ScopeRegistry,
        EntityRegistryService,
        'EntityManager',
      ],
      global: true,
    } as IDynamicModule;
  }

  /**
   * Register entities for a feature module.
   *
   * Generates schemas internally, wires DI providers, and auto-generates
   * services/resolvers based on the registration config.
   */
  static forFeature(
    registrations: EntityRegistration[],
    extraProviders?: IProvider[]
  ): IDynamicModule {
    const schemas: any[] = [];
    const providers: IProvider[] = [];
    const exports: any[] = [];

    // Collect entity classes for schema registry population
    const entityClasses: Function[] = [];

    for (const reg of registrations) {
      const { entity, dto, name } = reg;
      const entityName = name || getEntityName(entity).toLowerCase();

      // Track entity class for schema registry
      entityClasses.push(entity);

      // Generate schema internally
      const schema = resolveSchema(entity);
      schemas.push(schema);
      if (schema.satellites) {
        for (const satellite of Object.values(schema.satellites)) {
          schemas.push(satellite);
        }
      }

      // Service: auto-generated or custom (both get repo injected automatically)
      const serviceToken = reg.service ? reg.service : `${getEntityName(entity)}Service`;

      if (reg.service) {
        providers.push({
          provide: reg.service,
          useFactory: (em: any, moduleRef: any) => {
            const repo = em.getRepository(getEntityName(entity));
            const service = new (reg.service as any)(repo, moduleRef);
            service.indexer = getGlobalIndexer();
            return service;
          },
          inject: [EntityManager, ModuleRef],
        });
        exports.push(reg.service);
      } else {
        providers.push({
          provide: serviceToken,
          useFactory: (em: any) => {
            const repo = em.getRepository(getEntityName(entity));
            const service = new (defineService(entity) as any)(repo);
            service.indexer = getGlobalIndexer();
            return service;
          },
          inject: [EntityManager],
        });
        exports.push(serviceToken);
      }

      // DataLoader: auto-register entity with EntityDataLoaderFactory (if available)
      const loaderRegistrationToken = `DATALOADER_REG_${getEntityName(entity)}`;
      providers.push({
        provide: loaderRegistrationToken,
        useFactory: (loaderFactory: any, _service: any) => {
          if (loaderFactory && typeof loaderFactory.registerEntity === 'function') {
            // Register primary-key loader
            loaderFactory.registerEntity(entityName, serviceToken);

            // Register FK loaders for @HasMany relations on this entity
            const relations: any[] = getMetadata(RELATION_METADATA, entity.prototype) || [];

            for (const rel of relations) {
              if (rel.type === 'hasMany') {
                const relatedEntity = rel.target();
                const relatedName = (relatedEntity.name || '').toLowerCase();
                const fk = rel.options?.foreignKey || `${entityName}_id`;
                const fkKey = `${relatedName}:${fk}`;
                const relatedServiceToken = `${relatedEntity.name}Service`;
                loaderFactory.registerFkLoader(fkKey, relatedServiceToken, fk);
              }
            }
          }
          return null; // side-effect only
        },
        inject: [{ token: 'EntityDataLoaderFactory', optional: true }, serviceToken],
      });

      // Resolver: custom or auto-generated (only if dto provided)
      if (reg.resolver) {
        providers.push({
          provide: reg.resolver,
          useFactory: (service: any) => {
            const resolver = new (reg.resolver as any)(service);
            return resolver;
          },
          inject: [serviceToken],
        });
        exports.push(reg.resolver);
      } else if (dto) {
        const BaseResolver = defineResolver({
          entity,
          create: dto.create,
          update: dto.update,
          filter: dto.filter,
          sort: dto.sort,
          name: entityName,
        });

        @Resolver(() => entity)
        class AutoResolver extends BaseResolver {
          constructor() {
            super();
          }
        }

        const resolverToken = `${getEntityName(entity)}Resolver`;
        providers.push({
          provide: resolverToken,
          useFactory: (service: any) => {
            const resolver = new AutoResolver();
            resolver.service = service;
            return resolver;
          },
          inject: [serviceToken],
        });
        providers.push({
          provide: AutoResolver,
          useExisting: resolverToken,
        });
      }

      // Controller: custom class or auto-generated (only if controller option provided)
      if (reg.controller) {
        if (typeof reg.controller === 'function') {
          // Custom controller class — register directly
          providers.push({
            provide: reg.controller,
            useFactory: (service: any) => {
              const ctrl = new (reg.controller as any)(service);
              return ctrl;
            },
            inject: [serviceToken],
          });
          exports.push(reg.controller);
        } else {
          // Auto-generate controller
          const controllerOpts: ControllerRegistrationOptions =
            reg.controller === true ? { path: pluralizeSimple(entityName) } : reg.controller;

          const BaseController = defineController({
            entity,
            path: controllerOpts.path,
            dto: dto ? { create: dto.create, update: dto.update } : undefined,
            actions: controllerOpts.actions,
            resourceName: getEntityName(entity),
          });

          @Controller(controllerOpts.path)
          class AutoController extends BaseController {
            constructor() {
              super();
            }
          }

          const controllerToken = `${getEntityName(entity)}Controller`;
          providers.push({
            provide: controllerToken,
            useFactory: (service: any) => {
              const ctrl = new AutoController();
              (ctrl as any).service = service;
              return ctrl;
            },
            inject: [serviceToken],
          });
          providers.push({
            provide: AutoController,
            useExisting: controllerToken,
          });
          exports.push(controllerToken);
        }
      }
    }

    // Add any extra providers (e.g., link providers from getLinkProviders())
    if (extraProviders?.length) {
      providers.push(...extraProviders);
      exports.push(...extraProviders.map((p: any) => p.provide).filter(Boolean));
    }

    // Register entities with SchemaRegistryPopulator for auto-population
    const schemaPopulatorRegistration: IProvider = {
      provide: `SCHEMA_REGISTRY_POPULATION_${Date.now()}_${Math.random()}`,
      useFactory: (populator: SchemaRegistryPopulator, entityRegistry: EntityRegistryService) => {
        for (const entityClass of entityClasses) {
          populator.addEntity(entityClass);
        }
        // Also register with EntityRegistry (for scope population in onModuleInit)
        entityRegistry.addEntities(entityClasses);
        return null;
      },
      inject: [SchemaRegistryPopulator, EntityRegistryService],
    };
    providers.push(schemaPopulatorRegistration);

    return {
      module: OrmModule,
      imports: [MikroOrmModule.forFeature(entityClasses)],
      providers,
      exports: [...exports, MikroOrmModule.forFeature(entityClasses)],
    };
  }
}
