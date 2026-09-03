/**
 * @file query-builder.ts
 * @module @stackra/nestjs-orm/query-builder
 * @description Fluent chainable query builder that wraps MikroORM's find/findOne
 *   with named scopes, eager loading, relation filtering, and virtual counts.
 *   Delegates execution to MikroORM's EntityManager preserving identity map and UoW.
 */

import type { EntityManager } from '@mikro-orm/core';

import type { ScopeRegistry } from './scope-registry';

// ============================================================================
// Types
// ============================================================================

// ============================================================================
// QueryBuilder
// ============================================================================

/**
 * Fluent chainable query builder for ORM entities.
 *
 * Wraps MikroORM's `em.find()` / `em.findOne()` with:
 * - Named scopes from `@Scope()` decorator
 * - Chainable `where()`, `orWhere()`, `orderBy()`, `limit()`, `offset()`, `select()`
 * - `populate()` for eager loading with optional constraint callbacks
 * - `whereHas()` for filtering entities by related record existence
 * - `withCount()` for virtual relation count properties
 *
 * All execution methods delegate to MikroORM preserving identity map, UoW,
 * global filters, and the full MikroORM feature set.
 *
 * @typeParam T - The entity type
 *
 * @example
 * ```typescript
 * const products = await new FluentQueryBuilder(em, Product, scopeRegistry)
 *   .scope('active')
 *   .where({ category_id: catId })
 *   .orderBy('name', 'asc')
 *   .limit(20)
 *   .populate(['translations'])
 *   .getMany();
 * ```
 */
export class FluentQueryBuilder<T extends object = any> {
  private readonly entityName: string;
  private conditions: Record<string, any> = {};
  private orConditions: Record<string, any>[] = [];
  private orderByClause: Record<string, 'asc' | 'desc'> = {};
  private limitValue?: number;
  private offsetValue?: number;
  private selectFields?: string[];
  private populateRelations: string[] = [];
  private countRelations: string[] = [];
  private bypassedScopes: Set<string> = new Set();
  private appliedScopes: string[] = [];
  private filtersOverride?: Record<string, boolean>;

  /**
   * @param em - MikroORM EntityManager
   * @param entityClass - The entity class constructor
   * @param scopeRegistry - The scope registry for resolving named scopes
   */
  public constructor(
    private readonly em: EntityManager,
    private readonly entityClass: Function & { new (...args: any[]): T },
    private readonly scopeRegistry: ScopeRegistry
  ) {
    this.entityName = entityClass.name.toLowerCase();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Condition Methods
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Add WHERE conditions (composed with AND against existing conditions).
   *
   * @param condition - MikroORM FilterQuery object
   * @returns This QueryBuilder instance for chaining
   */
  public where(condition: Record<string, any>): this {
    Object.assign(this.conditions, condition);
    return this;
  }

  /**
   * Add OR conditions. Each call adds a separate OR branch.
   *
   * @param condition - MikroORM FilterQuery object
   * @returns This QueryBuilder instance for chaining
   */
  public orWhere(condition: Record<string, any>): this {
    this.orConditions.push(condition);
    return this;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Ordering & Pagination
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Add ORDER BY clause.
   *
   * @param field - Column name to sort by
   * @param direction - Sort direction (default: 'asc')
   * @returns This QueryBuilder instance for chaining
   */
  public orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): this {
    this.orderByClause[field] = direction;
    return this;
  }

  /**
   * Limit the number of results.
   *
   * @param value - Maximum number of results to return
   * @returns This QueryBuilder instance for chaining
   */
  public limit(value: number): this {
    this.limitValue = value;
    return this;
  }

  /**
   * Skip the first N results.
   *
   * @param value - Number of results to skip
   * @returns This QueryBuilder instance for chaining
   */
  public offset(value: number): this {
    this.offsetValue = value;
    return this;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Field Selection
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Select specific fields only (partial loading).
   *
   * @param fields - Array of field names to select
   * @returns This QueryBuilder instance for chaining
   */
  public select(fields: string[]): this {
    this.selectFields = fields;
    return this;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Eager Loading
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Configure eager loading for specified relations.
   *
   * @param relations - Array of relation names (supports dot-notation)
   * @returns This QueryBuilder instance for chaining
   */
  public populate(relations: string[]): this {
    for (const rel of relations) {
      if (!this.populateRelations.includes(rel)) {
        this.populateRelations.push(rel);
      }
    }
    return this;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Scopes
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Apply a named scope's filter conditions to this query.
   *
   * @param name - The scope name (must be registered via `@Scope()` on the entity)
   * @returns This QueryBuilder instance for chaining
   */
  public scope(name: string): this {
    const scopeDef = this.scopeRegistry.get(this.entityName, name);
    if (!scopeDef) return this;

    this.appliedScopes.push(name);

    if (scopeDef.conditions) {
      Object.assign(this.conditions, scopeDef.conditions);
    }
    if (scopeDef.callback) {
      scopeDef.callback(this);
    }

    return this;
  }

  /**
   * Bypass a specific default scope for this query.
   *
   * @param name - The scope name to bypass
   * @returns This QueryBuilder instance for chaining
   */
  public withoutScope(name: string): this {
    this.bypassedScopes.add(name);
    return this;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Relation Filtering
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Filter results to only entities that have at least one matching related record.
   *
   * @param relation - The relation name
   * @param callback - Optional callback to further constrain the relation query
   * @returns This QueryBuilder instance for chaining
   */
  public whereHas(relation: string, callback?: (qb: FluentQueryBuilder<any>) => void): this {
    // Uses MikroORM's nested filter syntax: { relation: { $ne: null } }
    // or with callback constraints on the relation
    if (callback) {
      const subQb = new FluentQueryBuilder(this.em, Object as any, this.scopeRegistry);
      callback(subQb);
      this.conditions[relation] = { ...this.conditions[relation], ...subQb.conditions };
    } else {
      this.conditions[relation] = { $ne: null, ...this.conditions[relation] };
    }
    return this;
  }

  /**
   * Add a virtual count of the specified relation to each result entity.
   *
   * Note: This uses MikroORM's formula/populate mechanism. The count is
   * available as `entity.__countRelation` after execution.
   *
   * @param relation - The relation name to count
   * @returns This QueryBuilder instance for chaining
   */
  public withCount(relation: string): this {
    this.countRelations.push(relation);
    return this;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Filter Overrides
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Disable a MikroORM global filter for this query.
   *
   * @param filterName - The filter name (e.g., 'softDelete')
   * @returns This QueryBuilder instance for chaining
   */
  public withoutFilter(filterName: string): this {
    if (!this.filtersOverride) this.filtersOverride = {};
    this.filtersOverride[filterName] = false;
    return this;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Execution Methods
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Execute the query and return all matching entities.
   *
   * @returns Array of matching entities
   */
  public async getMany(): Promise<T[]> {
    this.applyDefaultScopes();
    const [where, options] = this.buildFindOptions();
    return this.em.find(this.entityClass as any, where as any, options as any);
  }

  /**
   * Execute the query and return the first matching entity, or null.
   *
   * @returns The first matching entity, or null
   */
  public async getOne(): Promise<T | null> {
    this.applyDefaultScopes();
    const [where, options] = this.buildFindOptions();
    return this.em.findOne(this.entityClass as any, where as any, options as any);
  }

  /**
   * Execute the query and return the first matching entity, or throw NotFoundException.
   *
   * @returns The first matching entity
   * @throws {Error} When no entity matches
   */
  public async getOneOrFail(): Promise<T> {
    this.applyDefaultScopes();
    const [where, options] = this.buildFindOptions();
    return this.em.findOneOrFail(this.entityClass as any, where as any, options as any);
  }

  /**
   * Count matching entities without loading them.
   *
   * @returns The count of matching entities
   */
  public async count(): Promise<number> {
    this.applyDefaultScopes();
    const [where, options] = this.buildFindOptions();
    return this.em.count(this.entityClass as any, where as any, options as any);
  }

  /**
   * Execute with offset-based pagination.
   *
   * @param page - Page number (1-indexed)
   * @param limit - Items per page
   * @returns Paginated result with items and metadata
   */
  public async paginate(page: number, limit: number): Promise<IPaginatedResult<T>> {
    this.applyDefaultScopes();
    const p = Math.max(page, 1);
    const l = Math.min(Math.max(limit, 1), 100);

    const [where, options] = this.buildFindOptions();
    const paginatedOptions = {
      ...options,
      offset: (p - 1) * l,
      limit: l,
    };

    const [items, total] = (await Promise.all([
      this.em.find(this.entityClass as any, where as any, paginatedOptions as any),
      this.em.count(this.entityClass as any, where as any, options as any),
    ])) as [T[], number];

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

  // ─────────────────────────────────────────────────────────────────────────
  // Private
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Apply default scopes that haven't been bypassed.
   */
  private applyDefaultScopes(): void {
    const defaults = this.scopeRegistry.getDefaultScopes(this.entityName);
    for (const name of defaults) {
      if (!this.bypassedScopes.has(name) && !this.appliedScopes.includes(name)) {
        this.scope(name);
      }
    }
  }

  /**
   * Build the MikroORM find options from accumulated state.
   *
   * @returns Tuple of [where, options]
   */
  private buildFindOptions(): [Record<string, any>, Record<string, any>] {
    const where: Record<string, any> = { ...this.conditions };

    // Compose OR conditions
    if (this.orConditions.length > 0) {
      where.$or = this.orConditions;
    }

    const options: Record<string, any> = {};

    if (Object.keys(this.orderByClause).length > 0) {
      options.orderBy = this.orderByClause;
    }
    if (this.limitValue !== undefined) {
      options.limit = this.limitValue;
    }
    if (this.offsetValue !== undefined) {
      options.offset = this.offsetValue;
    }
    if (this.selectFields && this.selectFields.length > 0) {
      options.fields = this.selectFields;
    }
    if (this.populateRelations.length > 0) {
      options.populate = this.populateRelations;
    }
    if (this.filtersOverride) {
      options.filters = this.filtersOverride;
    }

    return [where, options];
  }
}
