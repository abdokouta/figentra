/**
 * @file seeder-context.ts
 * @module @stackra/nestjs-orm/seeders
 * @description Type-safe context store for sharing entities between seeders.
 *   Keys by entity class reference (not string), stores full entities (not just IDs).
 *
 *   Pattern:
 *   1. Seeder creates entities → stores them via `SeederContext.store(User, entities)`
 *   2. Downstream factory references via `SeederContext.random(User)?.id`
 */

/**
 * Type-safe context store for cross-seeder entity sharing.
 *
 * Stores full entity instances keyed by their class constructor. Factories
 * and downstream seeders can access any field on the stored entities,
 * not just IDs.
 *
 * @example
 * ```typescript
 * // In TenantSeeder:
 * SeederContext.store(Tenant, tenants);
 *
 * // In UserFactory:
 * owner_id: SeederContext.random(Tenant)?.id,
 * owner_email: SeederContext.random(Tenant)?.email,
 * ```
 */
export class SeederContext {
  /** Internal storage: entity class → array of entity instances. */
  private static registry = new Map<Function, any[]>();

  /**
   * Store entities for a given class.
   *
   * @param entityClass - The entity class constructor (e.g., User, Tenant)
   * @param entities - Array of entity instances to store
   */
  public static store<T>(entityClass: new (...args: any[]) => T, entities: T[]): void {
    const existing = SeederContext.registry.get(entityClass) ?? [];
    SeederContext.registry.set(entityClass, [...existing, ...entities]);
  }

  /**
   * Get a random entity from a previously-stored set.
   *
   * @param entityClass - The entity class constructor
   * @returns A random entity instance, or undefined if none stored
   */
  public static random<T>(entityClass: new (...args: any[]) => T): T | undefined {
    const entities = SeederContext.registry.get(entityClass) as T[] | undefined;
    if (!entities || entities.length === 0) return undefined;
    return entities[Math.floor(Math.random() * entities.length)];
  }

  /**
   * Get all stored entities for a class.
   *
   * @param entityClass - The entity class constructor
   * @returns Array of stored entities (empty if none stored)
   */
  public static all<T>(entityClass: new (...args: any[]) => T): T[] {
    return (SeederContext.registry.get(entityClass) as T[]) ?? [];
  }

  /**
   * Get the first stored entity for a class.
   *
   * @param entityClass - The entity class constructor
   * @returns The first entity, or undefined
   */
  public static first<T>(entityClass: new (...args: any[]) => T): T | undefined {
    return SeederContext.all(entityClass)[0];
  }

  /**
   * Check if entities have been stored for a class.
   *
   * @param entityClass - The entity class constructor
   * @returns True if at least one entity is stored
   */
  public static has(entityClass: Function): boolean {
    const entities = SeederContext.registry.get(entityClass);
    return entities !== undefined && entities.length > 0;
  }

  /**
   * Get all class names that have stored entities.
   *
   * @returns Array of class name strings (for logging/debugging)
   */
  public static keys(): string[] {
    return [...SeederContext.registry.keys()].map((cls) => cls.name);
  }

  /**
   * Clear all stored context. Call between test runs or at seeder start.
   */
  public static clear(): void {
    SeederContext.registry.clear();
  }

  /**
   * Get the count of stored entities for a class.
   *
   * @param entityClass - The entity class constructor
   * @returns Number of stored entities
   */
  public static count(entityClass: Function): number {
    return SeederContext.registry.get(entityClass)?.length ?? 0;
  }
}
