import { Factory } from '@mikro-orm/seeder';
import type { EntityManager } from '@mikro-orm/core';
import { faker, type Faker } from '@faker-js/faker';

import { BaseEntity } from '../entity/base.entity';
import { SeederContext } from '../seeders/seeder-context';

// ============================================================================
// Internal Relation State
// ============================================================================

/** Internal state tracking for factory relation helpers. */
interface FactoryRelationState {
  /** Child factories to create after parent is persisted. */
  hasRelations: Array<{ factory: BaseFactory<any>; count: number; foreignKey?: string }>;
  /** Parent entity or factory to assign FK from. */
  forParent: { entity?: BaseEntity; factory?: BaseFactory<any>; foreignKey?: string } | null;
  /** Recycled entity instances by constructor reference. */
  recycled: Map<Function, BaseEntity>;
  /** Sequence items to rotate through when creating multiple. */
  sequenceItems: Partial<any>[];
  /** Callbacks invoked after in-memory creation (before persist). */
  afterMakingCallbacks: Array<(entity: any) => void | Promise<void>>;
  /** Callbacks invoked after database persistence. */
  afterCreatingCallbacks: Array<(entity: any) => void | Promise<void>>;
}

/**
 * Abstract Base Factory
 *
 * Base class for entity factories extending MikroORM's Factory.
 * Provides Laravel-style fluent relation helpers (`has`, `for`, `recycle`,
 * `sequence`, `afterMaking`, `afterCreating`) on top of MikroORM's seeder
 * factory primitives.
 *
 * @template T - The entity type this factory creates
 *
 * @see https://mikro-orm.io/docs/seeding#using-entity-factories
 *
 * @example
 * ```typescript
 * // Basic usage
 * const user = await UserFactory.make(em).createOne();
 *
 * // With relations (Laravel-style)
 * const user = await UserFactory.make(em)
 *   .has(PostFactory.make(em), 3)       // create 3 posts after user
 *   .afterCreating((u) => console.log('Created:', u.id))
 *   .createOne();
 *
 * // Attach to parent
 * const post = await PostFactory.make(em)
 *   .for(existingUser)
 *   .createOne();
 *
 * // Sequence through values
 * const users = await UserFactory.make(em)
 *   .sequence([{ role: 'admin' }, { role: 'user' }, { role: 'viewer' }])
 *   .create(9); // cycles: admin, user, viewer, admin, user, viewer...
 * ```
 */
export abstract class BaseFactory<T extends BaseEntity = BaseEntity> extends Factory<T> {
  /**
   * Faker.js instance for generating fake data.
   *
   * @protected
   * @readonly
   */
  protected readonly faker: Faker = faker;

  /**
   * Seeder context for cross-factory FK resolution.
   *
   * Use `this.context.random(EntityName)?.id` to get a random ID from a
   * previously-seeded entity set. Use `this.context.store(EntityClass, entities)`
   * in seeders to populate.
   *
   * @protected
   * @readonly
   */
  protected readonly context = SeederContext;

  /** Internal relation state for has/for/recycle/sequence/callbacks. */
  private _relationState: FactoryRelationState = {
    hasRelations: [],
    forParent: null,
    recycled: new Map(),
    sequenceItems: [],
    afterMakingCallbacks: [],
    afterCreatingCallbacks: [],
  };

  /** Counter for sequence rotation during batch creates. */
  private _sequenceIndex = 0;

  /**
   * Static factory method to create a factory instance.
   *
   * @param em - MikroORM EntityManager instance
   * @returns New factory instance
   */
  static make<T extends BaseEntity>(
    this: new (em: EntityManager) => BaseFactory<T>,
    em: EntityManager
  ): BaseFactory<T> {
    return new this(em);
  }

  // ========================================================================
  // RELATION HELPERS (Laravel-style)
  // ========================================================================

  /**
   * Create N related child entities after the parent is persisted.
   *
   * The child entities' FK field will be set to the parent's ID after persistence.
   * The FK field name is inferred as `{parentEntityName}_id` unless specified.
   *
   * @param relatedFactory - Factory instance for the child entity
   * @param count - Number of children to create (default: 1)
   * @param foreignKey - Optional FK field name override
   * @returns This factory instance for chaining
   *
   * @example
   * ```typescript
   * const user = await UserFactory.make(em)
   *   .has(PostFactory.make(em), 3)           // 3 posts with user_id = user.id
   *   .has(CommentFactory.make(em), 5)        // 5 comments with user_id = user.id
   *   .createOne();
   * ```
   */
  public has<R extends BaseEntity>(
    relatedFactory: BaseFactory<R>,
    count: number = 1,
    foreignKey?: string
  ): this {
    this._relationState.hasRelations.push({ factory: relatedFactory, count, foreignKey });
    return this;
  }

  /**
   * Assign a parent entity's PK to this entity's FK before persistence.
   *
   * @param parent - Parent entity instance or factory
   * @param foreignKey - Optional FK field name override (inferred from parent class name)
   * @returns This factory instance for chaining
   *
   * @example
   * ```typescript
   * // With existing entity
   * const post = await PostFactory.make(em)
   *   .for(existingUser)
   *   .createOne();
   *
   * // With factory (creates parent first)
   * const post = await PostFactory.make(em)
   *   .for(UserFactory.make(em))
   *   .createOne();
   * ```
   */
  public for<P extends BaseEntity>(parent: P | BaseFactory<P>, foreignKey?: string): this {
    if (parent instanceof BaseFactory) {
      this._relationState.forParent = { factory: parent, foreignKey };
    } else {
      this._relationState.forParent = { entity: parent, foreignKey };
    }
    return this;
  }

  /**
   * Reuse an existing entity instance for all FK references to that type.
   *
   * When creating entities that reference the recycled entity's type, the
   * recycled instance's ID will be used instead of creating new instances.
   *
   * @param entity - The entity instance to reuse
   * @returns This factory instance for chaining
   *
   * @example
   * ```typescript
   * const tenant = await TenantFactory.make(em).createOne();
   * const users = await UserFactory.make(em)
   *   .recycle(tenant)  // All users get owner_id = tenant.id
   *   .create(10);
   * ```
   */
  public recycle<R extends BaseEntity>(entity: R): this {
    this._relationState.recycled.set(entity.constructor, entity);
    return this;
  }

  /**
   * Rotate through attribute sets when creating multiple entities.
   *
   * Each entity at index `i` merges `items[i % items.length]` into its attributes.
   *
   * @param items - Array of partial attribute overrides to cycle through
   * @returns This factory instance for chaining
   *
   * @example
   * ```typescript
   * const users = await UserFactory.make(em)
   *   .sequence([
   *     { role: 'admin' },
   *     { role: 'editor' },
   *     { role: 'viewer' },
   *   ])
   *   .create(9); // admin, editor, viewer, admin, editor, viewer, ...
   * ```
   */
  public sequence(items: Partial<T>[]): this {
    this._relationState.sequenceItems = items;
    return this;
  }

  /**
   * Register a callback invoked after in-memory entity creation (before persistence).
   *
   * @param callback - Function receiving the entity instance
   * @returns This factory instance for chaining
   *
   * @example
   * ```typescript
   * const users = await UserFactory.make(em)
   *   .afterMaking((user) => {
   *     user.displayName = `${user.firstName} ${user.lastName}`;
   *   })
   *   .create(5);
   * ```
   */
  public afterMaking(callback: (entity: T) => void | Promise<void>): this {
    this._relationState.afterMakingCallbacks.push(callback);
    return this;
  }

  /**
   * Register a callback invoked after successful database persistence.
   *
   * @param callback - Function receiving the persisted entity instance
   * @returns This factory instance for chaining
   *
   * @example
   * ```typescript
   * const users = await UserFactory.make(em)
   *   .afterCreating(async (user) => {
   *     await assignDefaultRole(user);
   *   })
   *   .create(5);
   * ```
   */
  public afterCreating(callback: (entity: T) => void | Promise<void>): this {
    this._relationState.afterCreatingCallbacks.push(callback);
    return this;
  }

  // ========================================================================
  // OVERRIDDEN CREATION METHODS
  // ========================================================================

  /**
   * Create one entity in-memory without persisting.
   * Applies sequence, for-parent, recycled references, and afterMaking callbacks.
   *
   * @param overrides - Optional attribute overrides
   * @returns The created entity instance
   */
  public override makeOne(overrides?: Partial<T>): T {
    const sequenceOverrides = this.getSequenceOverrides();
    const parentOverrides = this.getParentOverrides();
    const recycledOverrides = this.getRecycledOverrides();

    const entity = super.makeOne({
      ...sequenceOverrides,
      ...parentOverrides,
      ...recycledOverrides,
      ...overrides,
    } as any);

    // Run afterMaking callbacks synchronously (makeOne is sync)
    for (const cb of this._relationState.afterMakingCallbacks) {
      const result = cb(entity);
      // If callback is async, we can't await in sync context — skip
      if (result && typeof (result as any).then === 'function') {
        // Best effort: async callbacks in makeOne are not fully supported
      }
    }

    this._sequenceIndex++;
    return entity;
  }

  /**
   * Create and persist one entity.
   * Applies all relation helpers (has, for, recycle, sequence, callbacks).
   *
   * @param overrides - Optional attribute overrides
   * @returns The persisted entity
   */
  public override async createOne(overrides?: Partial<T>): Promise<T> {
    // Resolve parent if it's a factory
    await this.resolveParentFactory();

    const sequenceOverrides = this.getSequenceOverrides();
    const parentOverrides = this.getParentOverrides();
    const recycledOverrides = this.getRecycledOverrides();

    const entity = super.makeOne({
      ...sequenceOverrides,
      ...parentOverrides,
      ...recycledOverrides,
      ...overrides,
    } as any);

    // Run afterMaking callbacks
    for (const cb of this._relationState.afterMakingCallbacks) {
      await cb(entity);
    }

    // Persist parent entity
    const em = (this as any).em as EntityManager;
    em.persist(entity);
    await em.flush();

    // Create has-relations (children)
    for (const { factory, count, foreignKey } of this._relationState.hasRelations) {
      const fk = foreignKey || this.inferForeignKey();
      for (let i = 0; i < count; i++) {
        await factory.for(entity as any, fk).createOne();
      }
    }

    // Run afterCreating callbacks
    for (const cb of this._relationState.afterCreatingCallbacks) {
      await cb(entity);
    }

    this._sequenceIndex++;
    return entity;
  }

  // ========================================================================
  // FLUENT HELPER METHODS FOR MIXINS
  // ========================================================================

  /**
   * Add timestamps to the entity (createdAt, updatedAt).
   *
   * @param createdAt - Optional custom createdAt date (defaults to recent past)
   * @param updatedAt - Optional custom updatedAt date (defaults to createdAt or now)
   * @returns Factory instance for method chaining
   */
  withTimestamps(createdAt?: Date, updatedAt?: Date): this {
    return this.each((entity: any) => {
      if ('createdAt' in entity) {
        entity.createdAt = createdAt ?? this.faker.date.recent({ days: 30 });
      }
      if ('updatedAt' in entity) {
        entity.updatedAt =
          updatedAt ??
          (createdAt ? this.faker.date.between({ from: createdAt, to: new Date() }) : new Date());
      }
    });
  }

  /**
   * Add UUID primary key to the entity.
   *
   * @param customUuid - Optional custom UUID to use instead of generating one
   * @returns Factory instance for method chaining
   */
  withUuid(customUuid?: string): this {
    return this.each((entity: any) => {
      if ('id' in entity && (typeof entity.id === 'string' || !entity.id)) {
        entity.id = customUuid ?? this.faker.string.uuid();
      }
    });
  }

  /**
   * Add user stamps to the entity (createdBy, updatedBy, deletedBy).
   *
   * @param userId - User ID to set as creator/updater
   * @param options - Optional configuration for different user IDs per field
   * @returns Factory instance for method chaining
   */
  withUserStamps(
    userId: number | string,
    options?: {
      updatedBy?: number | string;
      deletedBy?: number | string;
    }
  ): this {
    return this.each((entity: any) => {
      if ('createdBy' in entity) {
        entity.createdBy = userId;
      }
      if ('updatedBy' in entity) {
        entity.updatedBy = options?.updatedBy ?? userId;
      }
      if ('deletedBy' in entity && options?.deletedBy !== undefined) {
        entity.deletedBy = options.deletedBy;
      }
    });
  }

  /**
   * Add soft delete timestamp to the entity.
   *
   * @param deletedAt - Optional custom deletedAt date (defaults to recent past)
   * @returns Factory instance for method chaining
   */
  withSoftDeletes(deletedAt?: Date): this {
    return this.each((entity: any) => {
      if ('deletedAt' in entity) {
        entity.deletedAt = deletedAt ?? this.faker.date.recent({ days: 7 });
      }
    });
  }

  /** Mark entity as active. */
  active(): this {
    return this.each((entity: any) => {
      if ('isActive' in entity) {
        entity.isActive = true;
      }
    });
  }

  /** Mark entity as inactive. */
  inactive(): this {
    return this.each((entity: any) => {
      if ('isActive' in entity) {
        entity.isActive = false;
      }
    });
  }

  /**
   * Apply custom state transformation.
   *
   * @param stateName - Name of the state (for documentation/debugging)
   * @param callback - Function to transform the entity
   * @returns Factory instance for method chaining
   */
  state(_stateName: string, callback: (entity: T) => void): this {
    return this.each(callback);
  }

  /**
   * Apply attributes conditionally.
   *
   * @param condition - Boolean condition or function that returns boolean
   * @param callback - Function to apply if condition is true
   * @returns Factory instance for method chaining
   */
  when(condition: boolean | (() => boolean), callback: (factory: this) => this): this {
    const shouldApply = typeof condition === 'function' ? condition() : condition;
    return shouldApply ? callback(this) : this;
  }

  /**
   * Apply attributes unless condition is true (inverse of `when`).
   *
   * @param condition - Boolean condition or function that returns boolean
   * @param callback - Function to apply if condition is false
   * @returns Factory instance for method chaining
   */
  unless(condition: boolean | (() => boolean), callback: (factory: this) => this): this {
    const shouldSkip = typeof condition === 'function' ? condition() : condition;
    return !shouldSkip ? callback(this) : this;
  }

  // ========================================================================
  // PRIVATE HELPERS
  // ========================================================================

  /**
   * Get sequence overrides for the current entity index.
   */
  private getSequenceOverrides(): Partial<T> {
    const items = this._relationState.sequenceItems;
    if (items.length === 0) return {} as Partial<T>;
    return items[this._sequenceIndex % items.length] as Partial<T>;
  }

  /**
   * Get parent FK overrides (from `for()` call).
   */
  private getParentOverrides(): Partial<T> {
    const parent = this._relationState.forParent;
    if (!parent) return {} as Partial<T>;

    const entity = parent.entity;
    if (!entity) return {} as Partial<T>;

    const fk = parent.foreignKey || this.inferParentForeignKey(entity);
    return { [fk]: (entity as any).id } as any;
  }

  /**
   * Get recycled entity overrides.
   */
  private getRecycledOverrides(): Partial<T> {
    const overrides: Record<string, any> = {};
    for (const [constructor, entity] of this._relationState.recycled) {
      const fk = `${constructor.name.toLowerCase()}_id`;
      overrides[fk] = (entity as any).id;
    }
    return overrides as Partial<T>;
  }

  /**
   * Resolve parent factory into an entity instance (creates if needed).
   */
  private async resolveParentFactory(): Promise<void> {
    const parent = this._relationState.forParent;
    if (!parent || !parent.factory) return;

    const entity = await parent.factory.createOne();
    parent.entity = entity;
    parent.factory = undefined;
  }

  /**
   * Infer the FK field name for has() relations from this entity's class name.
   */
  private inferForeignKey(): string {
    const modelName = ((this as any).model || (this as any).constructor).name || 'entity';
    return `${modelName.toLowerCase()}_id`;
  }

  /**
   * Infer the FK field name from a parent entity's class name.
   */
  private inferParentForeignKey(parentEntity: BaseEntity): string {
    const parentName = parentEntity.constructor.name || 'parent';
    return `${parentName.toLowerCase()}_id`;
  }
}
