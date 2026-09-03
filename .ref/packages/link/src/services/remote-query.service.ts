/**
 * @file remote-query.service.ts
 * @module @stackra/nestjs-link/services
 * @description RemoteQueryService — the cross-module query traversal engine.
 *
 * This service resolves relationships across module boundaries by using
 * the `extends` metadata registered via `defineLink()`. When a consumer
 * queries an entity and requests related data from another module, the
 * RemoteQueryService:
 *
 * 1. Fetches the primary data from the entry point service
 * 2. Inspects the requested expands against registered extensions
 * 3. Extracts FK values from the primary data
 * 4. Fetches related data from the target service using those FKs
 * 5. Stitches the related data onto the primary results
 *
 * This is the NestJS equivalent of MedusaJS's `RemoteQuery` + `RemoteJoiner`.
 *
 * ## Usage
 *
 * ```typescript
 * @IInjectable()
 * export class CartService {
 *   constructor(private readonly remoteQuery: RemoteQueryService) {}
 *
 *   async getCartWithRegion(cartId: string) {
 *     const [cart] = await this.remoteQuery.query({
 *       service: 'CartModule',
 *       filters: { id: cartId },
 *       fields: ['*'],
 *       expands: {
 *         region: { fields: ['id', 'name', 'currency_code'] },
 *       },
 *     });
 *     return cart; // { id, items, ..., region: { id, name, currency_code } }
 *   }
 * }
 * ```
 *
 * ## Batching
 *
 * When resolving relations for multiple primary records, the engine batches
 * FK lookups into a single query (e.g., `WHERE id IN [...]`) to avoid N+1.
 *
 * ## Limitations
 *
 * - Max traversal depth: 3 levels (configurable)
 * - Max batch size: 4000 IDs per query (splits into multiple batches)
 * - Only works with services registered via `registerResolver()`
 */

import { IInjectable, Logger, IOnModuleInit } from '@nestjs/common';
import { LinkRegistry } from '../registries/link.registry';
import type { ILinkExtends, ILinkRelationship } from '../interfaces/link-extends.interface';
import type {
  IRemoteQuery,
  IRemoteQueryExpand,
  IRemoteQueryResult,
  IServiceResolver,
} from '../interfaces/remote-query.interface';

/** Maximum number of IDs to batch in a single query. */
const MAX_BATCH_SIZE = 4000;

/** Maximum depth for nested relation traversal. */
const MAX_TRAVERSAL_DEPTH = 3;

/**
 * Internal representation of a resolved extension — maps an entity's
 * field alias to its relationship metadata for quick lookup.
 */
interface ResolvedExtension {
  /** The service that owns the entity being extended. */
  serviceName: string;
  /** The entity being extended. */
  entity: string;
  /** Map of field alias → relationship config. */
  relationships: Map<string, ILinkRelationship>;
  /** Map of field alias → traversal path. */
  fieldAliases: Map<string, { path: string; isList: boolean }>;
}

/**
 * RemoteQueryService — resolves cross-module relationships at query time.
 *
 * Registered globally via `LinkModule.forRoot()`. Feature modules register
 * their service resolvers via `registerResolver()`, and link definitions
 * register their `extends` metadata automatically.
 */
@IInjectable()
export class RemoteQueryService implements IOnModuleInit {
  private readonly logger = new Logger(RemoteQueryService.name);

  /**
   * Service resolvers — each module registers one to handle data fetching.
   * Key: serviceName, Value: resolver implementation.
   */
  private readonly resolvers = new Map<string, IServiceResolver>();

  /**
   * Resolved extensions — indexed by `serviceName:entity` for O(1) lookup.
   * Built from all registered link `extends` metadata at init time.
   */
  private readonly extensions = new Map<string, ResolvedExtension>();

  public constructor(private readonly linkRegistry: LinkRegistry) {}

  /**
   * Build the extensions map from all registered link metadata.
   * Called after all modules have registered their links.
   */
  public onModuleInit(): void {
    this.buildExtensions();
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  /**
   * Register a service resolver for cross-module data fetching.
   *
   * Each module should call this once during initialization to make its
   * entities available for remote query traversal.
   *
   * @param resolver - The service resolver to register
   *
   * @example
   * ```typescript
   * // In RegionModule's onModuleInit:
   * this.remoteQuery.registerResolver({
   *   serviceName: 'RegionModule',
   *   list: (filters, options) => this.regionService.findAll(filters, options),
   * });
   * ```
   */
  public registerResolver(resolver: IServiceResolver): void {
    if (this.resolvers.has(resolver.serviceName)) {
      this.logger.warn(
        `Resolver for "${resolver.serviceName}" is already registered. Overwriting.`
      );
    }
    this.resolvers.set(resolver.serviceName, resolver);
  }

  /**
   * Register link extensions for query traversal.
   *
   * Called by `LinkModule.forFeature()` when a link has `extends` config.
   * Adds relationship metadata to the extensions map so the query engine
   * knows how to traverse from one entity to another.
   *
   * @param extensions - Array of extends configurations from a link definition
   */
  public registerExtensions(extensions: ILinkExtends[]): void {
    for (const ext of extensions) {
      const key = `${ext.serviceName}:${ext.entity}`;

      if (!this.extensions.has(key)) {
        this.extensions.set(key, {
          serviceName: ext.serviceName,
          entity: ext.entity,
          relationships: new Map(),
          fieldAliases: new Map(),
        });
      }

      const resolved = this.extensions.get(key)!;

      // Register the relationship
      resolved.relationships.set(ext.relationship.alias, ext.relationship);

      // Register field aliases
      if (ext.fieldAlias) {
        for (const [alias, value] of Object.entries(ext.fieldAlias)) {
          const normalized =
            typeof value === 'string'
              ? { path: value, isList: false }
              : { path: value.path, isList: value.isList ?? false };
          resolved.fieldAliases.set(alias, normalized);
        }
      }
    }
  }

  /**
   * Execute a cross-module query with automatic relation resolution.
   *
   * Fetches the primary data from the entry point service, then resolves
   * any requested `expands` by fetching related data from other modules
   * and stitching it onto the results.
   *
   * @param query - The remote query specification
   * @returns Query result with relations stitched in
   *
   * @example
   * ```typescript
   * const result = await remoteQuery.query({
   *   service: 'CartModule',
   *   filters: { id: cartId },
   *   fields: ['*'],
   *   expands: {
   *     region: { fields: ['id', 'name', 'currency_code'] },
   *   },
   * });
   * ```
   */
  public async query<T = unknown>(query: IRemoteQuery): Promise<IRemoteQueryResult<T>> {
    const resolver = this.resolvers.get(query.service);
    if (!resolver) {
      throw new Error(
        `No resolver registered for service "${query.service}". ` +
          `Call remoteQuery.registerResolver() in the module's onModuleInit().`
      );
    }

    // Fetch primary data
    const options: any = {};
    if (query.fields && !query.fields.includes('*')) {
      options.select = query.fields;
    }
    if (query.pagination) {
      options.skip = query.pagination.skip;
      options.take = query.pagination.take;
    }

    let data: unknown[];
    let count: number | undefined;

    if (query.pagination && resolver.listAndCount) {
      const [rows, total] = await resolver.listAndCount(query.filters ?? {}, options);
      data = rows;
      count = total;
    } else {
      data = await resolver.list(query.filters ?? {}, options);
    }

    // Resolve expands (cross-module relations)
    if (query.expands && Object.keys(query.expands).length > 0) {
      await this.resolveExpands(data, query.service, query.expands, 0);
    }

    // Build result
    const result: IRemoteQueryResult<T> = { data: data as T[] };
    if (count !== undefined && query.pagination) {
      result.metadata = {
        skip: query.pagination.skip ?? 0,
        take: query.pagination.take ?? data.length,
        count,
        hasMore: (query.pagination.skip ?? 0) + data.length < count,
      };
    }

    return result;
  }

  /**
   * Convenience method — query and return just the data array.
   *
   * @param query - The remote query specification
   * @returns Array of results with relations stitched in
   */
  public async queryData<T = unknown>(query: IRemoteQuery): Promise<T[]> {
    const result = await this.query<T>(query);
    return result.data;
  }

  // ==========================================================================
  // Relation Resolution Engine
  // ==========================================================================

  /**
   * Resolve expands for a set of primary records.
   *
   * For each requested expand, finds the extension metadata, extracts
   * FK values from the primary data, fetches related data in batch,
   * and stitches it onto the primary records.
   */
  private async resolveExpands(
    data: unknown[],
    serviceName: string,
    expands: Record<string, IRemoteQueryExpand>,
    depth: number
  ): Promise<void> {
    if (depth >= MAX_TRAVERSAL_DEPTH) {
      this.logger.warn(
        `Max traversal depth (${MAX_TRAVERSAL_DEPTH}) reached. Skipping deeper expands.`
      );
      return;
    }

    if (!data.length) return;

    // Find extensions for this service/entity
    // We try all registered extensions for this service
    const matchingExtensions = this.findExtensionsForService(serviceName);

    for (const [alias, expandConfig] of Object.entries(expands)) {
      // Find the relationship for this alias
      const relationship = this.findRelationship(matchingExtensions, alias);
      if (!relationship) {
        this.logger.debug(`No extension found for "${serviceName}.${alias}". Skipping.`);
        continue;
      }

      await this.resolveRelationship(data, alias, relationship, expandConfig, depth);
    }
  }

  /**
   * Resolve a single relationship for all primary records.
   *
   * 1. Extracts FK values from primary data
   * 2. Batches the FK values into chunks of MAX_BATCH_SIZE
   * 3. Fetches related data from the target service
   * 4. Stitches related data onto primary records
   * 5. Recursively resolves nested expands
   */
  private async resolveRelationship(
    data: unknown[],
    alias: string,
    relationship: ILinkRelationship,
    expandConfig: IRemoteQueryExpand,
    depth: number
  ): Promise<void> {
    const targetResolver = this.resolvers.get(relationship.serviceName);
    if (!targetResolver) {
      this.logger.warn(
        `No resolver for "${relationship.serviceName}" (needed for "${alias}"). Skipping.`
      );
      return;
    }

    // Extract FK values from primary data
    const fkField = relationship.foreignKey;
    const pkField = relationship.primaryKey;
    const isList = relationship.isList ?? false;

    // Determine which field on the primary data holds the FK
    const fkValues = this.extractFieldValues(data, fkField);
    const uniqueFkValues = [...new Set(fkValues.filter((v) => v != null))];

    if (!uniqueFkValues.length) {
      // No FK values — set all relations to null/empty
      for (const record of data) {
        (record as any)[alias] = isList ? [] : null;
      }
      return;
    }

    // Fetch related data in batches
    const relatedData = await this.fetchInBatches(
      targetResolver,
      pkField,
      uniqueFkValues,
      expandConfig
    );

    // Build lookup map: pkValue → related record(s)
    const lookupMap = this.buildLookupMap(relatedData, pkField, isList);

    // Stitch related data onto primary records
    for (const record of data) {
      const fkValue = (record as any)[fkField];
      if (fkValue == null) {
        (record as any)[alias] = isList ? [] : null;
      } else if (isList) {
        (record as any)[alias] = lookupMap.get(String(fkValue)) ?? [];
      } else {
        const related = lookupMap.get(String(fkValue));
        (record as any)[alias] = Array.isArray(related) ? (related[0] ?? null) : (related ?? null);
      }
    }

    // Recursively resolve nested expands on the related data
    if (expandConfig.expands && Object.keys(expandConfig.expands).length > 0) {
      const allRelated = relatedData.flat();
      if (allRelated.length) {
        await this.resolveExpands(
          allRelated,
          relationship.serviceName,
          expandConfig.expands,
          depth + 1
        );
      }
    }
  }

  /**
   * Fetch related data in batches to avoid exceeding query limits.
   */
  private async fetchInBatches(
    resolver: IServiceResolver,
    pkField: string,
    ids: unknown[],
    expandConfig: IRemoteQueryExpand
  ): Promise<unknown[]> {
    const results: unknown[] = [];
    const options: any = { take: null };

    if (expandConfig.fields && !expandConfig.fields.includes('*')) {
      options.select = expandConfig.fields;
    }

    for (let i = 0; i < ids.length; i += MAX_BATCH_SIZE) {
      const batch = ids.slice(i, i + MAX_BATCH_SIZE);
      const filters: Record<string, unknown> = {
        ...expandConfig.filters,
        [pkField]: batch,
      };

      const batchResult = await resolver.list(filters, options);
      results.push(...batchResult);
    }

    return results;
  }

  // ==========================================================================
  // Private Helpers
  // ==========================================================================

  /**
   * Build the extensions map from all registered link metadata.
   */
  private buildExtensions(): void {
    // Extensions are registered dynamically via registerExtensions()
    // This method is called at init time but extensions may arrive later
    // via forFeature() calls. The map is built incrementally.
    this.logger.debug(
      `RemoteQueryService initialized with ${this.extensions.size} extensions ` +
        `and ${this.resolvers.size} resolvers.`
    );
  }

  /**
   * Find all extensions registered for a given service.
   */
  private findExtensionsForService(serviceName: string): ResolvedExtension[] {
    const results: ResolvedExtension[] = [];
    for (const [key, ext] of this.extensions) {
      if (ext.serviceName === serviceName) {
        results.push(ext);
      }
    }
    return results;
  }

  /**
   * Find a relationship by alias across all extensions for a service.
   */
  private findRelationship(
    extensions: ResolvedExtension[],
    alias: string
  ): ILinkRelationship | undefined {
    for (const ext of extensions) {
      const rel = ext.relationships.get(alias);
      if (rel) return rel;
    }
    return undefined;
  }

  /**
   * Extract field values from an array of records.
   */
  private extractFieldValues(data: unknown[], field: string): unknown[] {
    return data.map((record) => (record as any)[field]);
  }

  /**
   * Build a lookup map from related data for efficient stitching.
   */
  private buildLookupMap(
    data: unknown[],
    keyField: string,
    isList: boolean
  ): Map<string, unknown | unknown[]> {
    const map = new Map<string, unknown | unknown[]>();

    for (const record of data) {
      const key = String((record as any)[keyField]);

      if (isList) {
        if (!map.has(key)) {
          map.set(key, []);
        }
        (map.get(key) as unknown[]).push(record);
      } else {
        // For single relations, first match wins
        if (!map.has(key)) {
          map.set(key, record);
        }
      }
    }

    return map;
  }
}
