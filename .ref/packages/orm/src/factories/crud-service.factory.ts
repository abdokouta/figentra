/**
 * @file crud-service.factory.ts
 * @description Factory that generates a CRUD service class with all standard operations.
 *
 * Accepts either:
 * - An entity class (infers everything from decorators)
 * - An options object (for custom buildWhere/buildSort overrides)
 *
 * @example Minimal (auto-infers everything):
 * ```ts
 * @IInjectable()
 * export class ProductService extends defineService(Product) {
 *   constructor(@InjectRepository(ProductSchema) repo) { super(repo); }
 * }
 * ```
 *
 * @example With overrides:
 * ```ts
 * @IInjectable()
 * export class TenantService extends defineService(Tenant, {
 *   buildWhere: (filter, opts) => { ... custom logic ... },
 * }) {
 *   constructor(@InjectRepository(TenantSchema) repo) { super(repo); }
 * }
 * ```
 */

import { IInjectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { EntityRepository } from '@mikro-orm/core';
import { getMetadata } from '@vivtel/metadata';
import { ICrudService } from '../interfaces/crud-service.interface';
import { ENTITY_METADATA, TRAIT_METADATA } from '../constants/metadata-keys.constant';
import { buildFilterQuery } from '../filters/build-filter-query.util';
import { buildSortQuery } from '../filters/build-sort-query.util';
import { getStoredFields, StoredField } from '../decorators/stored.decorator';
import { wrapFlushError } from '../errors/wrap-flush-error.util';
import { getEagerLoadRelations } from '../decorators/eager-load.decorator';

// ─── Pagination Helpers ───────────────────────────────────────────────────────

function encodeCursor(value: any): string {
  const str = value instanceof Date ? value.toISOString() : String(value);
  return Buffer.from(str).toString('base64url');
}

function decodeCursor(cursor: string): string {
  return Buffer.from(cursor, 'base64url').toString('utf-8');
}

/**
 * Auto-generates a buildWhere function based on entity traits.
 * MikroORM's softDelete entity filter handles `deletedAt: null` automatically.
 * Converts filter input to MikroORM operators via buildFilterQuery().
 */
function createDefaultBuildWhere(_hasSoftDeletes: boolean) {
  return (filter: any, _opts?: { withTrashed?: boolean; onlyTrashed?: boolean }) => {
    const where: Record<string, any> = {};

    if (filter == null) return where;

    // Handle OR/AND combinators
    const { OR, AND, ...rest } = filter;

    // Convert all filter fields to MikroORM operators
    Object.assign(where, buildFilterQuery(rest));

    if (OR?.length) where.$or = OR.map((sub: any) => buildFilterQuery(sub));
    if (AND?.length) where.$and = AND.map((sub: any) => buildFilterQuery(sub));

    return where;
  };
}

/**
 * Creates a CRUD service class for an entity.
 *
 * @param entityClass - The decorated entity class (reads name + traits from metadata)
 * @param overrides - Optional custom buildWhere/buildSort functions
 * @returns An abstract class to extend with @IInjectable()
 */
export function defineService(entityClass: Function, overrides?: DefineServiceOptions): any {
  // Read entity metadata
  const entityMeta = getMetadata(ENTITY_METADATA, entityClass);
  const entityName = entityMeta?.name || entityClass.name;

  // Read traits to determine behavior
  const traits: string[] = getMetadata<string[]>(TRAIT_METADATA, entityClass.prototype) || [];
  const hasSoftDeletes = traits.includes('softDeletes');

  // Read stored fields for satellite routing
  const storedFields = getStoredFields(entityClass);

  // Compute satellite relation keys for auto-populate
  const satelliteSuffixes = [
    ...new Set(storedFields.filter((f) => f.strategy === 'table').map((f) => f.suffix)),
  ];

  // Resolve where/sort builders
  const resolveWhere = overrides?.buildWhere || createDefaultBuildWhere(hasSoftDeletes);
  const resolveSort = overrides?.buildSort || ((sort: any) => buildSortQuery(sort));

  // Check if entity is indexed (for ES auto-sync)
  let isEntityIndexed = false;
  try {
    const { isIndexed } = require('@stackra/nestjs-indexer');
    isEntityIndexed = isIndexed(entityClass);
  } catch {
    // @stackra/nestjs-indexer not installed
  }

  // Check if entity is @Scoped() for auto-population of owner_id
  const isScoped = !!getMetadata('stackra:scope:scoped_entity', entityClass);

  // Lazy indexer getter — resolves at call time (after app bootstrap)
  let _getIndexer: (() => any) | null = () => (globalThis as any).__ORM_INDEXER_SERVICE__ || null;

  // Read @EagerLoad metadata for auto-population
  const eagerLoadRelations = getEagerLoadRelations(entityClass);

  // Lazy cache manager getter — resolves at call time (optional dep)
  const _getCacheManager = (): any => (globalThis as any).__ORM_CACHE_MANAGER__ || null;

  /**
   * Invalidate cache tags for this entity after mutations.
   * Fails silently if cache is not available.
   */
  const invalidateEntityCache = async (): Promise<void> => {
    try {
      const cacheManager = _getCacheManager();
      if (!cacheManager) return;
      const tag = entityName.toLowerCase();
      if (typeof cacheManager.invalidateTag === 'function') {
        await cacheManager.invalidateTag(tag);
      } else if (typeof cacheManager.invalidateTags === 'function') {
        await cacheManager.invalidateTags([tag]);
      }
    } catch {
      // Fail-open — cache invalidation must never break the operation
    }
  };

  @IInjectable()
  abstract class GeneratedCrudService implements ICrudService<any> {
    constructor(protected readonly repo: EntityRepository<any>) {}

    /** Optional indexer service — set by OrmModule if entity is @Indexed(). */
    indexer?: any;

    /** Convert entity to plain object for indexing. */
    private toPlainForIndex(entity: any): Record<string, any> {
      const plain: Record<string, any> = {};
      for (const key of Object.keys(entity)) {
        if (!key.startsWith('__') && key !== 'translations' && key !== 'reactions') {
          const val = entity[key];
          if (val !== undefined && typeof val !== 'function' && !val?.isInitialized) {
            plain[key] = val;
          }
        }
      }
      return plain;
    }

    async findAll(
      filter?: any,
      sort?: any,
      opts?: { withTrashed?: boolean; onlyTrashed?: boolean }
    ) {
      const where: Record<string, any> = resolveWhere(filter, opts);
      const orderBy = resolveSort(sort);
      const queryOpts: any = { orderBy };

      // Merge @EagerLoad relations into populate
      if (eagerLoadRelations.length > 0) {
        queryOpts.populate = [...eagerLoadRelations];
      }

      // Handle trashed options via MikroORM filter control
      if (opts?.withTrashed || opts?.onlyTrashed) {
        queryOpts.filters = { softDelete: false };
      }
      if (opts?.onlyTrashed) {
        where.deletedAt = { $ne: null };
      }

      return this.repo.find(where as any, {
        ...queryOpts,
      });
    }

    async findById(id: string) {
      // Merge satellite suffixes + @EagerLoad relations
      const populateSet = new Set([...satelliteSuffixes, ...eagerLoadRelations]);
      const opts: any = populateSet.size > 0 ? { populate: [...populateSet] } : {};
      return this.repo.findOne({ id } as any, opts);
    }

    async findByIdOrFail(id: string) {
      // Merge satellite suffixes + @EagerLoad relations
      const populateSet = new Set([...satelliteSuffixes, ...eagerLoadRelations]);
      const opts: any = populateSet.size > 0 ? { populate: [...populateSet] } : {};
      const entity = await this.repo.findOne({ id } as any, opts);
      if (!entity) throw new NotFoundException(`${entityName} with id "${id}" not found`);
      return entity;
    }

    async findByIds(ids: readonly string[]): Promise<(any | Error)[]> {
      if (ids.length === 0) return [];
      const queryOpts: any = satelliteSuffixes.length > 0 ? { populate: satelliteSuffixes } : {};
      const where: Record<string, any> = { id: { $in: [...ids] } };
      const entities = await this.repo.find(where as any, queryOpts);
      // Return in the same order as input ids (DataLoader contract)
      const map = new Map<string, any>();
      for (const entity of entities) {
        map.set((entity as any).id, entity);
      }
      return ids.map((id) => map.get(id) ?? new Error(`${entityName} with id "${id}" not found`));
    }

    async findByForeignKey(field: string, ids: readonly string[]): Promise<Map<string, any[]>> {
      if (ids.length === 0) return new Map();
      const queryOpts: any = satelliteSuffixes.length > 0 ? { populate: satelliteSuffixes } : {};
      const where: Record<string, any> = { [field]: { $in: [...ids] } };
      const entities = await this.repo.find(where as any, queryOpts);
      // Group results by FK value — one FK can have many entities
      const grouped = new Map<string, any[]>();
      for (const id of ids) {
        grouped.set(id, []);
      }
      for (const entity of entities) {
        const fkValue = String((entity as any)[field]);
        const list = grouped.get(fkValue);
        if (list) {
          list.push(entity);
        } else {
          grouped.set(fkValue, [entity]);
        }
      }
      return grouped;
    }

    async count(filter?: any, opts?: { withTrashed?: boolean; onlyTrashed?: boolean }) {
      const where: Record<string, any> = resolveWhere(filter, opts);
      const queryOpts: any = {};

      if (opts?.withTrashed || opts?.onlyTrashed) {
        queryOpts.filters = { softDelete: false };
      }
      if (opts?.onlyTrashed) {
        where.deletedAt = { $ne: null };
      }

      return this.repo.count(where as any, queryOpts);
    }

    async paginateLengthAware(
      page: number,
      limit: number,
      filter?: any,
      sort?: any,
      opts?: { withTrashed?: boolean; onlyTrashed?: boolean }
    ) {
      const l = Math.min(Math.max(limit, 1), 100);
      const p = Math.max(page, 1);
      const where: Record<string, any> = resolveWhere(filter, opts);
      const orderBy = resolveSort(sort);
      const queryOpts: any = { orderBy };

      if (opts?.withTrashed || opts?.onlyTrashed) {
        queryOpts.filters = { softDelete: false };
      }
      if (opts?.onlyTrashed) {
        where.deletedAt = { $ne: null };
      }

      const [items, total] = await Promise.all([
        this.repo.find(
          where as any,
          {
            ...queryOpts,
            offset: (p - 1) * l,
            limit: l,
          } as any
        ),
        this.repo.count(where as any, queryOpts),
      ]);
      const totalPages = Math.ceil(total / l);
      return {
        items,
        meta: {
          total,
          page: p,
          limit: l,
          totalPages,
          count: items.length,
          hasNextPage: p < totalPages,
          hasPreviousPage: p > 1,
        },
      };
    }

    async paginateSimple(
      page: number,
      limit: number,
      filter?: any,
      sort?: any,
      opts?: { withTrashed?: boolean; onlyTrashed?: boolean }
    ) {
      const l = Math.min(Math.max(limit, 1), 100);
      const p = Math.max(page, 1);
      const where: Record<string, any> = resolveWhere(filter, opts);
      const queryOpts: any = {
        orderBy: resolveSort(sort),
        offset: (p - 1) * l,
        limit: l + 1,
      };

      if (opts?.withTrashed || opts?.onlyTrashed) {
        queryOpts.filters = { softDelete: false };
      }
      if (opts?.onlyTrashed) {
        where.deletedAt = { $ne: null };
      }

      const items = await this.repo.find(where as any, queryOpts);
      const hasMore = items.length > l;
      return {
        items: hasMore ? items.slice(0, l) : items,
        page: p,
        limit: l,
        hasMore,
      };
    }

    async paginateCursor(
      first: number,
      after?: string,
      filter?: any,
      sort?: any,
      opts?: { withTrashed?: boolean; onlyTrashed?: boolean }
    ) {
      const f = Math.min(Math.max(first, 1), 100);
      const where: Record<string, any> = resolveWhere(filter, opts);
      const orderBy = resolveSort(sort) || { createdAt: 'desc' };
      const cursorField = Object.keys(orderBy)[0] || 'createdAt';
      const queryOpts: any = { orderBy };

      if (opts?.withTrashed || opts?.onlyTrashed) {
        queryOpts.filters = { softDelete: false };
      }
      if (opts?.onlyTrashed) {
        where.deletedAt = { $ne: null };
      }

      if (after) {
        const val = decodeCursor(after);
        const dir = Object.values(orderBy)[0] || 'desc';
        where[cursorField] = {
          ...where[cursorField],
          [dir === 'desc' ? '$lt' : '$gt']: val,
        };
      }

      const countWhere: Record<string, any> = resolveWhere(filter, opts);
      if (opts?.onlyTrashed) {
        countWhere.deletedAt = { $ne: null };
      }
      const countOpts: any = {};
      if (opts?.withTrashed || opts?.onlyTrashed) {
        countOpts.filters = { softDelete: false };
      }

      const [items, totalCount] = await Promise.all([
        this.repo.find(
          where as any,
          {
            ...queryOpts,
            limit: f + 1,
          } as any
        ),
        this.repo.count(countWhere as any, countOpts),
      ]);

      const hasNextPage = items.length > f;
      const sliced = hasNextPage ? items.slice(0, f) : items;
      const edges = sliced.map((item: any) => ({
        node: item,
        cursor: encodeCursor(item[cursorField]),
      }));

      return {
        edges,
        pageInfo: {
          hasNextPage,
          hasPreviousPage: !!after,
          startCursor: edges[0]?.cursor ?? null,
          endCursor: edges[edges.length - 1]?.cursor ?? null,
        },
        totalCount,
      };
    }

    async create(input: any, ctx?: any) {
      const em = this.repo.getEntityManager();

      // Split input: main table fields vs satellite fields vs pivot fields
      const { mainData, satelliteData, pivotData } = splitInputBySatellites(input, storedFields);

      const createData: any = {
        id: randomUUID(),
        ...mainData,
        createdBy: ctx?.userId ?? null,
        updatedBy: ctx?.userId ?? null,
      };

      // Auto-populate owner_id and scope_node_id from active scope context
      if (isScoped && !createData.owner_id) {
        const scopeStore = (globalThis as any).__SCOPE_CONTEXT_STORE__;
        const scopeCtx = scopeStore?.get?.();
        if (scopeCtx) {
          createData.owner_id = scopeCtx.ownerId;
          if (!createData.scope_node_id) {
            createData.scope_node_id = scopeCtx.nodeId;
          }
        }
      }

      // Add satellite records as nested relations (MikroORM handles via OneToMany)
      for (const [suffix, fields] of Object.entries(satelliteData)) {
        if (Object.keys(fields as any).length > 0) {
          const partitionField = storedFields.find(
            (f) => f.strategy === 'table' && f.suffix === suffix
          )?.partitionBy;

          const satelliteRecord: any = {
            id: randomUUID(),
            ...(fields as any),
          };
          // Only add partition value (e.g. locale) if the satellite has a partition field
          if (partitionField) {
            satelliteRecord[partitionField] = 'en';
          }

          createData[suffix] = [satelliteRecord];
        }
      }

      const entity = em.create(entityName as any, createData as any);

      // Handle pivot data: write to shared polymorphic tables (entity_translations, entity_settings)
      for (const [suffix, fields] of Object.entries(pivotData)) {
        if (Object.keys(fields as any).length === 0) continue;
        const pivotEntityName = `EntityPivot${suffix.charAt(0).toUpperCase() + suffix.slice(1).replace(/s$/, '')}`;
        const partitionField = storedFields.find(
          (f) => f.strategy === 'pivot' && f.suffix === suffix
        )?.partitionBy;

        for (const [field, value] of Object.entries(fields as any)) {
          const pivotRecord: any = {
            id: randomUUID(),
            entityType: entityName,
            entityId: createData.id,
            field,
            value: String(value),
          };
          if (partitionField) {
            pivotRecord[partitionField] = 'en'; // default locale/key
          }
          em.create(pivotEntityName as any, pivotRecord);
        }
      }

      await em.flush();

      // Auto-index to Elasticsearch if entity is @Indexed()
      if (isEntityIndexed && _getIndexer) {
        try {
          const indexer = _getIndexer();
          if (!indexer) {
            await invalidateEntityCache();
            return entity;
          }
          await indexer.indexEntity(entityClass, createData.id, this.toPlainForIndex(entity));
        } catch (e: any) {
          console.error(`[ORM] Failed to index ${entityName}#${createData.id}:`, e.message);
        }
      }

      // Invalidate cache tags for this entity
      await invalidateEntityCache();

      return entity;
    }

    async update(input: any, ctx?: any) {
      const { id, ...data } = input;
      const entity = await this.findByIdOrFail(id);
      const em = this.repo.getEntityManager();

      // Split input into main vs satellite vs pivot fields
      const { mainData, satelliteData, pivotData } = splitInputBySatellites(data, storedFields);

      // Coerce main table values
      const sanitized: Record<string, any> = {};
      for (const [key, value] of Object.entries(mainData)) {
        if (value === undefined) continue;
        if (typeof value === 'number' && typeof (entity as any)[key] === 'string') {
          sanitized[key] = String(value);
        } else {
          sanitized[key] = value;
        }
      }
      sanitized.updatedBy = ctx?.userId ?? null;
      em.assign(entity, sanitized as any);

      // Update satellite records (find existing for default locale, update or create)
      for (const [suffix, fields] of Object.entries(satelliteData)) {
        if (Object.keys(fields as any).length === 0) continue;
        const collection = (entity as any)[suffix];
        if (collection && collection.isInitialized && collection.isInitialized()) {
          const items = collection.getItems();
          const partitionField = storedFields.find(
            (f) => f.strategy === 'table' && f.suffix === suffix
          )?.partitionBy;

          // For partitioned satellites: find by partition value; otherwise use first record
          const existing = partitionField
            ? items.find((t: any) => t[partitionField] === 'en') || items[0]
            : items[0];

          if (existing) {
            em.assign(existing, fields as any);
          } else {
            const satelliteEntityName = `${entityName}${suffix.charAt(0).toUpperCase() + suffix.slice(1).replace(/s$/, '')}`;
            const fkColumn = `${entityName.toLowerCase()}_id`;
            const newRecord: any = {
              id: randomUUID(),
              [fkColumn]: entity,
              ...(fields as any),
            };
            if (partitionField) newRecord[partitionField] = 'en';
            const created = em.create(satelliteEntityName as any, newRecord);
            collection.add(created);
          }
        }
      }

      // Update pivot data (upsert to shared polymorphic table)
      for (const [suffix, fields] of Object.entries(pivotData)) {
        if (Object.keys(fields as any).length === 0) continue;
        const pivotEntityName = `EntityPivot${suffix.charAt(0).toUpperCase() + suffix.slice(1).replace(/s$/, '')}`;
        const partitionField = storedFields.find(
          (f) => f.strategy === 'pivot' && f.suffix === suffix
        )?.partitionBy;

        for (const [field, value] of Object.entries(fields as any)) {
          const findCriteria: any = {
            entityType: entityName,
            entityId: id,
            field,
          };
          if (partitionField) findCriteria[partitionField] = 'en';

          const existingPivot = await em.findOne(pivotEntityName as any, findCriteria);
          if (existingPivot) {
            em.assign(existingPivot, { value: String(value) } as any);
          } else {
            const pivotRecord: any = {
              id: randomUUID(),
              entityType: entityName,
              entityId: id,
              field,
              value: String(value),
            };
            if (partitionField) pivotRecord[partitionField] = 'en';
            em.create(pivotEntityName as any, pivotRecord);
          }
        }
      }

      await em.flush();

      // Auto-index to Elasticsearch after update
      if (isEntityIndexed && _getIndexer) {
        try {
          const indexer = _getIndexer();
          if (!indexer) {
            await invalidateEntityCache();
            return entity;
          }
          await indexer.indexEntity(entityClass, id, this.toPlainForIndex(entity));
        } catch (e: any) {
          console.error(`[ORM] Failed to reindex ${entityName}#${id}:`, e.message);
        }
      }

      // Invalidate cache tags for this entity
      await invalidateEntityCache();

      return entity;
    }

    async softDelete(id: string, ctx?: any) {
      const entity = await this.findByIdOrFail(id);
      const em = this.repo.getEntityManager();
      em.assign(entity, {
        deletedAt: new Date(),
        deletedBy: ctx?.userId ?? null,
      } as any);
      await em.flush();

      // Remove from ES index on soft-delete
      if (isEntityIndexed && _getIndexer) {
        try {
          const indexer = _getIndexer();
          if (!indexer) {
            await invalidateEntityCache();
            return entity;
          }
          await indexer.removeEntity(entityClass, id);
        } catch (e: any) {
          console.error(`[ORM] Failed to remove ${entityName}#${id} from index:`, e.message);
        }
      }

      // Invalidate cache tags for this entity
      await invalidateEntityCache();

      return entity;
    }

    async restore(id: string, ctx?: any) {
      const entity = await this.repo.findOne(
        { id } as any,
        { filters: { softDelete: false } } as any
      );
      if (!entity) throw new NotFoundException(`${entityName} with id "${id}" not found`);
      const em = this.repo.getEntityManager();
      em.assign(entity, {
        deletedAt: null,
        deletedBy: null,
        updatedBy: ctx?.userId ?? null,
      } as any);
      await em.flush();
      await invalidateEntityCache();
      return entity;
    }

    async forceDelete(id: string) {
      const entity = await this.repo.findOne(
        { id } as any,
        { filters: { softDelete: false } } as any
      );
      if (!entity) throw new NotFoundException(`${entityName} with id "${id}" not found`);
      const em = this.repo.getEntityManager();
      em.remove(entity);
      await wrapFlushError(() => em.flush());
      await invalidateEntityCache();
      return true;
    }

    // ─── Convenience Persistence Patterns ───────────────────────────────────

    /**
     * Find the first entity matching `where`, or create one with merged defaults.
     * Respects soft-delete filter (excludes soft-deleted from existence check).
     *
     * @param where - Filter conditions to check for existence
     * @param defaults - Additional attributes to merge when creating
     * @returns The found or newly created entity
     */
    async firstOrCreate(where: Record<string, any>, defaults?: Record<string, any>) {
      const existing = await this.repo.findOne(where as any);
      if (existing) return existing;

      const em = this.repo.getEntityManager();
      const entity = em.create(
        entityName as any,
        {
          id: randomUUID(),
          ...where,
          ...defaults,
        } as any
      );
      em.persist(entity);
      await wrapFlushError(() => em.flush());
      return entity;
    }

    /**
     * Find an entity matching `where` and update it, or create one with merged attributes.
     * Respects soft-delete filter (excludes soft-deleted from existence check).
     *
     * @param where - Filter conditions to check for existence
     * @param attributes - Attributes to assign (update existing or create new)
     * @returns The updated or newly created entity
     */
    async updateOrCreate(where: Record<string, any>, attributes: Record<string, any>) {
      const em = this.repo.getEntityManager();
      const existing = await this.repo.findOne(where as any);

      if (existing) {
        em.assign(existing, attributes as any);
        await wrapFlushError(() => em.flush());
        return existing;
      }

      const entity = em.create(
        entityName as any,
        {
          id: randomUUID(),
          ...where,
          ...attributes,
        } as any
      );
      em.persist(entity);
      await wrapFlushError(() => em.flush());
      return entity;
    }

    /**
     * Database-level upsert using PostgreSQL's ON CONFLICT clause.
     *
     * @param data - Entity data to upsert
     * @param conflictKeys - Array of field names that form the conflict target
     * @returns The upserted entity
     */
    async upsert(data: Record<string, any>, conflictKeys: string[]) {
      const em = this.repo.getEntityManager();
      const upsertData = { id: randomUUID(), ...data };
      const result = await wrapFlushError(() =>
        em.upsert(entityName as any, upsertData as any, { onConflictFields: conflictKeys } as any)
      );
      return result;
    }

    // ─── Chunk & Iterate ────────────────────────────────────────────────────

    /**
     * Process large result sets in fixed-size batches.
     * Clears the identity map between batches to prevent memory accumulation.
     *
     * @param size - Batch size (number of entities per callback invocation)
     * @param callback - Function invoked with each batch; return `false` to stop
     * @param filter - Optional filter conditions
     * @param sort - Optional sort configuration
     */
    async chunk(
      size: number,
      callback: (batch: any[]) => boolean | void | Promise<boolean | void>,
      filter?: any,
      sort?: any
    ): Promise<void> {
      const where = resolveWhere(filter);
      const orderBy = resolveSort(sort) || { id: 'asc' };
      let offset = 0;

      while (true) {
        const batch = await this.repo.find(
          where as any,
          {
            orderBy,
            limit: size,
            offset,
          } as any
        );

        if (batch.length === 0) break;

        const result = await callback(batch);
        if (result === false) break;

        offset += size;

        // Clear identity map between batches to free memory
        const em = this.repo.getEntityManager();
        em.clear();
      }
    }

    /**
     * Returns an async iterator that yields entities in batches.
     * Clears the identity map between batches to prevent memory accumulation.
     *
     * @param size - Batch size (default: 100)
     * @param filter - Optional filter conditions
     * @param sort - Optional sort configuration
     * @returns AsyncIterableIterator yielding entities one at a time
     */
    async *iterate(size: number = 100, filter?: any, sort?: any): AsyncIterableIterator<any> {
      const where = resolveWhere(filter);
      const orderBy = resolveSort(sort) || { id: 'asc' };
      let offset = 0;

      while (true) {
        const batch = await this.repo.find(
          where as any,
          {
            orderBy,
            limit: size,
            offset,
          } as any
        );

        if (batch.length === 0) break;

        for (const entity of batch) {
          yield entity;
        }

        offset += size;

        // Clear identity map between batches
        const em = this.repo.getEntityManager();
        em.clear();
      }
    }

    // ─── Bulk Operations ────────────────────────────────────────────────────

    /**
     * Create multiple entities in a single flush (atomic).
     * If any entity fails constraint checks, the entire batch is rolled back.
     *
     * @param items - Array of entity data objects to create
     * @param ctx - Optional context (userId for audit stamps)
     * @returns Array of created entities
     */
    async bulkCreate(items: Record<string, any>[], ctx?: any): Promise<any[]> {
      const em = this.repo.getEntityManager();
      const entities: any[] = [];

      for (const item of items) {
        const entity = em.create(
          entityName as any,
          {
            id: randomUUID(),
            ...item,
            createdBy: ctx?.userId ?? null,
            updatedBy: ctx?.userId ?? null,
          } as any
        );
        em.persist(entity);
        entities.push(entity);
      }

      await wrapFlushError(() => em.flush());
      await invalidateEntityCache();
      return entities;
    }

    /**
     * Update multiple entities in a single flush (atomic).
     * Each item must contain an `id` field identifying the entity to update.
     *
     * @param items - Array of objects with `id` + update fields
     * @param ctx - Optional context (userId for audit stamps)
     * @returns Array of updated entities
     */
    async bulkUpdate(
      items: Array<{ id: string } & Record<string, any>>,
      ctx?: any
    ): Promise<any[]> {
      const em = this.repo.getEntityManager();
      const ids = items.map((item) => item.id);
      const entities = await this.repo.find({ id: { $in: ids } } as any);

      const entityMap = new Map<string, any>();
      for (const entity of entities) {
        entityMap.set((entity as any).id, entity);
      }

      const updated: any[] = [];
      for (const item of items) {
        const entity = entityMap.get(item.id);
        if (!entity) {
          throw new NotFoundException(`${entityName} with id "${item.id}" not found`);
        }
        const { id: _id, ...data } = item;
        em.assign(entity, {
          ...data,
          updatedBy: ctx?.userId ?? null,
        } as any);
        updated.push(entity);
      }

      await wrapFlushError(() => em.flush());
      await invalidateEntityCache();
      return updated;
    }

    /**
     * Soft-delete multiple entities in a single flush (atomic).
     *
     * @param ids - Array of entity IDs to soft-delete
     * @param ctx - Optional context (userId for audit stamps)
     */
    async bulkDelete(ids: string[], ctx?: any): Promise<void> {
      const em = this.repo.getEntityManager();
      const entities = await this.repo.find({ id: { $in: ids } } as any);

      const now = new Date();
      for (const entity of entities) {
        em.assign(entity, {
          deletedAt: now,
          deletedBy: ctx?.userId ?? null,
        } as any);
      }

      await wrapFlushError(() => em.flush());
      await invalidateEntityCache();
    }

    // ─── Transactional Helper ───────────────────────────────────────────────

    /**
     * Execute a callback within a database transaction.
     *
     * If the callback throws, the transaction is rolled back.
     * If it succeeds, the transaction is committed.
     *
     * @param fn - Async function receiving the EntityManager
     * @returns The callback's return value
     */
    async transactional<R>(fn: (em: any) => Promise<R>): Promise<R> {
      const em = this.repo.getEntityManager();
      return em.transactional(fn);
    }
  }

  return GeneratedCrudService;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Splits input data into main table fields, satellite (table) fields, and pivot fields.
 */
function splitInputBySatellites(
  input: Record<string, any>,
  storedFields: StoredField[]
): {
  mainData: Record<string, any>;
  satelliteData: Record<string, Record<string, any>>;
  pivotData: Record<string, Record<string, any>>;
} {
  const tableFieldKeys = new Set(
    storedFields.filter((f) => f.strategy === 'table').map((f) => f.propertyKey)
  );
  const pivotFieldKeys = new Set(
    storedFields.filter((f) => f.strategy === 'pivot').map((f) => f.propertyKey)
  );

  const mainData: Record<string, any> = {};
  const satelliteData: Record<string, Record<string, any>> = {};
  const pivotData: Record<string, Record<string, any>> = {};

  for (const field of storedFields.filter((f) => f.strategy === 'table')) {
    if (!satelliteData[field.suffix]) satelliteData[field.suffix] = {};
  }
  for (const field of storedFields.filter((f) => f.strategy === 'pivot')) {
    if (!pivotData[field.suffix]) pivotData[field.suffix] = {};
  }

  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue;

    if (tableFieldKeys.has(key)) {
      const field = storedFields.find((f) => f.propertyKey === key && f.strategy === 'table');
      if (field) satelliteData[field.suffix]![key] = value;
    } else if (pivotFieldKeys.has(key)) {
      const field = storedFields.find((f) => f.propertyKey === key && f.strategy === 'pivot');
      if (field) pivotData[field.suffix]![key] = value;
    } else {
      mainData[key] = value;
    }
  }

  return { mainData, satelliteData, pivotData };
}
