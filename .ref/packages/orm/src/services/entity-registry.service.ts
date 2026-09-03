/**
 * @file entity-registry.service.ts
 * @module @stackra/nestjs-orm/services
 * @description Global entity registry that accumulates all entity classes registered
 *   via `forRoot()` and `forFeature()`. Provides the single source of truth for
 *   what entities exist in the application — used by CLI, ScopeRegistry population,
 *   and schema introspection.
 */

import { IInjectable, IOnModuleInit } from '@nestjs/common';

import { ScopeRegistry } from '../query-builder/scope-registry';
import { getScopes, getDefaultScopeNames } from '../decorators/scope.decorator';
import { getEntityName } from '../utils/get-entity-name.util';

/**
 * Global entity registry.
 *
 * Accumulates entity classes from `forRoot()` and `forFeature()` calls, then
 * performs deferred initialization (scope population) in `onModuleInit()` —
 * after ALL modules have registered their entities.
 *
 * This solves the timing problem where `forRoot()` only sees root entities,
 * but `forFeature()` entities also need scope/lifecycle registration.
 *
 * @example
 * ```typescript
 * // Inject to discover all entities (e.g., in CLI bootstrap)
 * const registry = app.get(EntityRegistryService);
 * const allEntities = registry.getEntities();
 * ```
 */
@IInjectable()
export class EntityRegistryService implements IOnModuleInit {
  /** All registered entity classes (deduplicated). */
  private readonly entities = new Set<Function>();

  /** Whether onModuleInit has already run. */
  private initialized = false;

  public constructor(private readonly scopeRegistry: ScopeRegistry) {}

  // ─────────────────────────────────────────────────────────────────────────
  // Registration (called during module setup)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Register entity classes. Called by both forRoot() and forFeature().
   * Idempotent — same class registered twice is a no-op.
   *
   * @param entities - Array of entity class constructors
   */
  public addEntities(entities: Function[]): void {
    for (const entity of entities) {
      if (typeof entity === 'function') {
        this.entities.add(entity);
      }
    }

    // If already initialized (late forFeature after bootstrap), populate immediately
    if (this.initialized) {
      this.populateScopes(entities.filter((e) => typeof e === 'function'));
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Lifecycle
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * After ALL modules are initialized, populate the ScopeRegistry from
   * all registered entity metadata. This ensures forFeature() entities
   * are included.
   */
  public onModuleInit(): void {
    this.populateScopes([...this.entities]);
    this.initialized = true;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Query API
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get all registered entity classes.
   *
   * @returns Array of entity class constructors
   */
  public getEntities(): Function[] {
    return [...this.entities];
  }

  /**
   * Get entity class by name (case-insensitive).
   *
   * @param name - Entity class name
   * @returns The entity class, or undefined if not found
   */
  public getEntityByName(name: string): Function | undefined {
    const lower = name.toLowerCase();
    for (const entity of this.entities) {
      if (entity.name.toLowerCase() === lower) {
        return entity;
      }
    }
    return undefined;
  }

  /**
   * Check if an entity class is registered.
   *
   * @param entity - Entity class to check
   * @returns True if registered
   */
  public has(entity: Function): boolean {
    return this.entities.has(entity);
  }

  /**
   * Get the count of registered entities.
   *
   * @returns Number of registered entity classes
   */
  public count(): number {
    return this.entities.size;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Private
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Populate scope definitions from entity metadata into the ScopeRegistry.
   *
   * @param entities - Entity classes to process
   */
  private populateScopes(entities: Function[]): void {
    for (const entity of entities) {
      const entityName = getEntityName(entity).toLowerCase();

      // Skip if already populated (idempotent)
      if (this.scopeRegistry.getScopeNames(entityName).length > 0) continue;

      const scopes = getScopes(entity);
      for (const scope of scopes) {
        this.scopeRegistry.register(entityName, scope);
      }

      const defaultScopes = getDefaultScopeNames(entity);
      if (defaultScopes.length > 0) {
        this.scopeRegistry.registerDefaults(entityName, defaultScopes);
      }
    }
  }
}
