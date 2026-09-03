/**
 * @file orm-module-options.interface.ts
 * @description Options for OrmModule.forRoot().
 *
 * Note: Cross-module pivot links are NOT registered here anymore.
 * Use `LinkModule.forFeature()` from `@stackra/nestjs-link` in feature modules instead.
 *
 * ## Connection model
 * The ORM module supports one or more named PostgreSQL connections. The
 * `default` field (string) selects which named connection in `connections`
 * is treated as the primary one — it's what `@InjectRepository` and
 * `EntityManager` resolve to when no connection name is specified.
 *
 * ```typescript
 * OrmModule.forRoot({
 *   default: 'main',
 *   connections: {
 *     main: { dbName: 'app', user: 'postgres', password: 'postgres' },
 *     analytics: { dbName: 'analytics', user: 'postgres', password: 'postgres' },
 *   },
 *   entities: [User, Order],
 * })
 * ```
 */

import { IType } from '@nestjs/common';

/**
 * Root module options for `OrmModule.forRoot()`.
 *
 * @example
 * ```ts
 * OrmModule.forRoot({
 *   entities: [User, Role, Permission],
 *   default: 'main',
 *   connections: {
 *     main: { dbName: 'identity_service', user: 'postgres' },
 *   },
 * })
 * ```
 */
export interface OrmModuleOptions {
  /** Entity classes to register. Schemas are generated internally. */
  entities: IType<any>[];

  /**
   * Name of the connection to treat as the default (primary).
   *
   * Must match a key in `connections`. The default connection is what
   * `@InjectRepository(Entity)` and the bare `EntityManager` resolve to.
   *
   * If omitted, the connection literally named `"default"` is used. If
   * neither exists, the first connection in the map is used.
   */
  default?: string;

  /**
   * Named PostgreSQL connections. At least one is required.
   *
   * The connection picked by `default` (or `"default"` by convention)
   * is registered as the root MikroORM instance. All other connections
   * are registered as additional MikroORM instances.
   *
   * @example
   * ```typescript
   * connections: {
   *   main: { dbName: 'app', user: 'postgres', password: 'postgres' },
   *   analytics: { dbName: 'analytics', user: 'postgres', password: 'postgres' },
   * }
   * ```
   */
  connections: Record<string, OrmConnectionConfig>;

  /** Enable debug mode for all connections. Default: false. */
  debug?: boolean;

  /** Allow global context (for scripts/testing). Default: true. */
  allowGlobalContext?: boolean;

  /** MikroORM event subscribers (e.g. IndexerSubscriber for ES auto-sync). */
  subscribers?: any[];

  /** Optional IndexerService instance for auto-indexing @Indexed() entities. */
  indexerServiceToken?: string;

  /** Raw MikroORM config override (advanced — bypasses entity/connection). */
  config?: any;
}
