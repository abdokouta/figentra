/**
 * @file link-extends.interface.ts
 * @module @stackra/nestjs-link/interfaces
 * @description Defines the `extends` configuration for cross-module query
 * traversal — the mechanism that allows querying related entities across
 * module boundaries without manual service calls.
 *
 * Inspired by MedusaJS's `ModuleJoinerConfig.extends` pattern, adapted
 * for NestJS + MikroORM. When a link defines `extends`, it tells the
 * `RemoteQueryService` how to resolve relationships between entities
 * in different modules.
 *
 * ## How It Works
 *
 * 1. A link defines `extends` — declaring which entities gain new
 *    traversable relationships.
 * 2. At module init, `LinkModule.forFeature()` registers these extensions
 *    in the `LinkRegistry`.
 * 3. When `RemoteQueryService.query()` encounters a field alias (e.g.,
 *    `Cart.region`), it looks up the extension to find:
 *    - Which service to call
 *    - Which FK to use for the join
 *    - Whether it's a list or single relation
 * 4. The remote query engine fetches the related data from the target
 *    module's service and stitches it onto the result.
 *
 * ## Example: Read-Only Link (one-to-many, FK on source)
 *
 * ```typescript
 * // Cart has region_id → Region (different module)
 * export const CartRegionLink = defineLink({
 *   source: Cart,
 *   target: Region,
 *   readOnly: true,
 *   extends: [
 *     {
 *       serviceName: 'CartModule',
 *       entity: 'Cart',
 *       fieldAlias: { region: 'region_link.region' },
 *       relationship: {
 *         serviceName: 'RegionModule',
 *         entity: 'Region',
 *         primaryKey: 'id',
 *         foreignKey: 'region_id',
 *         alias: 'region',
 *         isList: false,
 *       },
 *     },
 *     {
 *       serviceName: 'RegionModule',
 *       entity: 'Region',
 *       fieldAlias: { carts: { path: 'cart_link.cart', isList: true } },
 *       relationship: {
 *         serviceName: 'CartModule',
 *         entity: 'Cart',
 *         primaryKey: 'region_id',
 *         foreignKey: 'id',
 *         alias: 'carts',
 *         isList: true,
 *       },
 *     },
 *   ],
 * });
 * ```
 */

/**
 * Describes a cross-module relationship for query traversal.
 *
 * This is the "pointer" that tells the remote query engine how to
 * fetch related data from another module.
 */
export interface ILinkRelationship {
  /**
   * The NestJS module/service name that owns the target entity.
   * Used to resolve which service to call for fetching data.
   */
  serviceName: string;

  /**
   * The target entity class name (e.g., 'Region', 'Cart').
   */
  entity: string;

  /**
   * The primary key on the target entity used for the join.
   * Typically 'id' for the "one" side.
   */
  primaryKey: string;

  /**
   * The foreign key used to match records.
   * - For "belongs to": the FK column on the source entity (e.g., 'region_id')
   * - For "has many": the FK column on the target entity
   */
  foreignKey: string;

  /**
   * The alias name for this relationship (used in field resolution).
   */
  alias: string;

  /**
   * Whether this relationship returns a list (true) or a single entity (false).
   */
  isList?: boolean;

  /**
   * Optional method suffix for the target service's list method.
   * E.g., 'Regions' → calls `listRegions()` instead of `list()`.
   */
  methodSuffix?: string;
}

/**
 * Describes how a link extends an existing entity with new traversable
 * relationships. Each `extends` entry adds relationship metadata to
 * an entity from another module.
 */
export interface ILinkExtends {
  /**
   * The module/service name that owns the entity being extended.
   */
  serviceName: string;

  /**
   * The entity class name being extended with new relationships.
   */
  entity: string;

  /**
   * Field aliases — maps friendly field names to traversal paths.
   *
   * @example
   * ```typescript
   * fieldAlias: {
   *   region: 'region_link.region',           // single relation
   *   payment_providers: {                    // list relation
   *     path: 'payment_provider_link.payment_provider',
   *     isList: true,
   *   },
   * }
   * ```
   */
  fieldAlias?: Record<string, FieldAliasValue>;

  /**
   * The relationship definition — how to traverse from this entity
   * to the related entity in another module.
   */
  relationship: ILinkRelationship;
}
